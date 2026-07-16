import { useMemo, useRef, useState, type FormEvent, type ReactElement } from "react";
import { KitButton } from "./ui/kit-button";
import {
  buildFrameworkConfirmationMessage,
  type FrameworkQuestionAnswer,
  type FrameworkQuestionsPayload
} from "../lib/frameworkQuestions";

type DraftAnswer = { selectedOptionIds: string[]; customAnswer: string };
type SubmissionState = "editing" | "sending" | "sent" | "failed";

function initialAnswers(payload: FrameworkQuestionsPayload, restored: FrameworkQuestionAnswer[] | null = null): Record<string, DraftAnswer> {
  const restoredById = new Map((restored ?? []).map((answer) => [answer.questionId, answer]));
  return Object.fromEntries(payload.questions.map((question) => {
    const answer = restoredById.get(question.id);
    return [question.id, {
      selectedOptionIds: answer?.selectedOptionIds.filter((optionId) => question.options.some((option) => option.id === optionId)) ?? [],
      customAnswer: answer?.customAnswer ?? ""
    }];
  }));
}

function storageKey(confirmationId: string): string {
  return `canvasight.framework-confirmation.${confirmationId}`;
}

function restoredSubmission(payload: FrameworkQuestionsPayload): FrameworkQuestionAnswer[] | null {
  try {
    const raw = sessionStorage.getItem(storageKey(payload.confirmationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { confirmationId?: unknown; answers?: unknown };
    if (parsed.confirmationId !== payload.confirmationId || !Array.isArray(parsed.answers)) return null;
    const answers = parsed.answers.filter((answer): answer is FrameworkQuestionAnswer => (
      Boolean(answer) &&
      typeof answer === "object" &&
      typeof (answer as FrameworkQuestionAnswer).questionId === "string" &&
      Array.isArray((answer as FrameworkQuestionAnswer).selectedOptionIds) &&
      typeof (answer as FrameworkQuestionAnswer).customAnswer === "string"
    ));
    return answers.length === payload.questions.length ? answers : null;
  } catch {
    return null;
  }
}

export function FrameworkQuestionsCard({ payload }: { payload: FrameworkQuestionsPayload }): ReactElement {
  const copy = payload.language === "en"
    ? { custom: "Custom answer", recommended: "Recommended", submit: "Confirm and continue", sending: "Sending…", retry: "Retry", sent: "Answers sent. Continuing in this task.", failed: "Could not send. Your selections are preserved; retry when ready." }
    : { custom: "自定义答案", recommended: "推荐", submit: "确认并继续", sending: "正在发送…", retry: "重试", sent: "答案已发送，将在当前任务中继续。", failed: "发送失败，已保留选择，请重试。" };
  const restoredRef = useRef<FrameworkQuestionAnswer[] | null>(restoredSubmission(payload));
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>(() => initialAnswers(payload, restoredRef.current));
  const [submittedAnswers, setSubmittedAnswers] = useState<FrameworkQuestionAnswer[] | null>(restoredRef.current);
  const [submissionState, setSubmissionState] = useState<SubmissionState>(restoredRef.current ? "sent" : "editing");
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  const isComplete = useMemo(
    () => payload.questions.every((question) => {
      const answer = answers[question.id];
      return Boolean(answer && (answer.selectedOptionIds.length > 0 || answer.customAnswer.trim()));
    }),
    [answers, payload.questions]
  );
  const answerSummary = useMemo(() => {
    if (!submittedAnswers) return [];
    const submittedById = new Map(submittedAnswers.map((answer) => [answer.questionId, answer]));
    return payload.questions.map((question) => {
      const answer = submittedById.get(question.id);
      const labels = (answer?.selectedOptionIds ?? [])
        .map((optionId) => question.options.find((option) => option.id === optionId)?.label)
        .filter((label): label is string => Boolean(label));
      if (answer?.customAnswer) labels.push(answer.customAnswer);
      return { questionId: question.id, question: question.question, answer: labels.join("、") };
    });
  }, [payload.questions, submittedAnswers]);

  const setOption = (questionId: string, optionId: string, checked: boolean, single: boolean) => {
    if (submissionState === "sent" || submissionState === "sending") return;
    setAnswers((current) => {
      const existing = current[questionId] ?? { selectedOptionIds: [], customAnswer: "" };
      const selectedOptionIds = single
        ? (checked ? [optionId] : [])
        : (checked ? Array.from(new Set([...existing.selectedOptionIds, optionId])) : existing.selectedOptionIds.filter((id) => id !== optionId));
      return {
        ...current,
        [questionId]: { selectedOptionIds, customAnswer: single && checked ? "" : existing.customAnswer }
      };
    });
  };

  const setCustomAnswer = (questionId: string, value: string, single: boolean) => {
    if (submissionState === "sent" || submissionState === "sending") return;
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        selectedOptionIds: single && value.trim() ? [] : (current[questionId]?.selectedOptionIds ?? []),
        customAnswer: value
      }
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isComplete || submittingRef.current || submissionState === "sent") return;
    submittingRef.current = true;
    setSubmissionState("sending");
    setError("");
    const submittedAnswers: FrameworkQuestionAnswer[] = payload.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: answers[question.id]?.selectedOptionIds ?? [],
      customAnswer: answers[question.id]?.customAnswer.trim() ?? ""
    }));
    const prompt = buildFrameworkConfirmationMessage(payload, submittedAnswers);
    try {
      if (!window.canvasightMcp) throw new Error("Canvasight message bridge is unavailable.");
      await window.canvasightMcp.sendFollowUpMessage({ prompt, content: [{ type: "text", text: prompt }] });
      try {
        sessionStorage.setItem(storageKey(payload.confirmationId), JSON.stringify({
          confirmationId: payload.confirmationId,
          answers: submittedAnswers
        }));
      } catch { /* best effort only */ }
      setSubmittedAnswers(submittedAnswers);
      setSubmissionState("sent");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : String(sendError));
      setSubmissionState("failed");
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <main className="framework-questions-shell" data-testid="framework-questions">
      <form className="framework-questions-card" data-state={submissionState} onSubmit={submit}>
        <header className="framework-questions-header">
          <p className="framework-questions-eyebrow">Canvasight</p>
          <h2>{payload.title}</h2>
          {payload.description ? <p>{payload.description}</p> : null}
        </header>
        {submissionState !== "sent" ? <div className="framework-questions-list">
          {payload.questions.map((question) => {
            const answer = answers[question.id] ?? { selectedOptionIds: [], customAnswer: "" };
            const inputType = question.selectionMode === "single" ? "radio" : "checkbox";
            return (
              <fieldset key={question.id} className="framework-question" data-testid={`framework-question-${question.id}`} disabled={submissionState === "sending"}>
                <legend>{question.question}</legend>
                <div className="framework-question-options">
                  {question.options.map((option) => {
                    const checked = answer.selectedOptionIds.includes(option.id);
                    return (
                      <label key={option.id} className={`assistant-provider-card framework-question-option${checked ? " is-selected" : ""}`}>
                        <input
                          type={inputType}
                          name={`framework-${payload.confirmationId}-${question.id}`}
                          value={option.id}
                          checked={checked}
                          onChange={(event) => setOption(question.id, option.id, event.currentTarget.checked, question.selectionMode === "single")}
                        />
                        <span className={`kit-checkbox framework-question-control${checked ? " is-checked" : ""}${inputType === "radio" ? " is-radio" : ""}`} aria-hidden="true">
                          <svg className="kit-checkbox-check" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="assistant-provider-card-copy framework-question-option-copy">
                          <span className="assistant-provider-card-title framework-question-option-title">{option.label}{option.recommended ? <span className="framework-question-recommended"> · {copy.recommended}</span> : null}</span>
                          {option.description ? <span className="assistant-provider-card-description framework-question-option-description">{option.description}</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <label className={`framework-question-custom${answer.customAnswer.trim() ? " is-active" : ""}`}>
                  <span>{question.customAnswerLabel || copy.custom}</span>
                  <textarea
                    className="settings-dialog-input framework-question-custom-input"
                    rows={2}
                    value={answer.customAnswer}
                    placeholder={question.customAnswerLabel || copy.custom}
                    onChange={(event) => setCustomAnswer(question.id, event.currentTarget.value, question.selectionMode === "single")}
                  />
                </label>
              </fieldset>
            );
          })}
        </div> : null}
        <footer className="framework-questions-footer">
          <div className={`framework-questions-status is-${submissionState}`} data-testid="framework-status" role="status" aria-live="polite">
            {submissionState === "sent" ? (
              <div className="framework-questions-answer-summary" data-testid="framework-answer-summary">
                <strong>{copy.sent}</strong>
                <ul>{answerSummary.map((item) => <li key={item.questionId}><span>{item.question}</span><b>{item.answer}</b></li>)}</ul>
              </div>
            ) : submissionState === "failed" ? `${copy.failed}${error ? ` ${error}` : ""}` : ""}
          </div>
          {submissionState !== "sent" ? (
            <KitButton className="framework-questions-submit" type="submit" filled size="md" disabled={!isComplete || submissionState === "sending"} aria-busy={submissionState === "sending"} data-testid="framework-submit">
              {submissionState === "sending" ? copy.sending : submissionState === "failed" ? copy.retry : copy.submit}
            </KitButton>
          ) : null}
        </footer>
      </form>
    </main>
  );
}
