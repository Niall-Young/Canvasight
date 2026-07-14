export type FrameworkQuestionOption = {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
};

export type FrameworkQuestion = {
  id: string;
  question: string;
  selectionMode: "single" | "multiple";
  options: FrameworkQuestionOption[];
  customAnswerLabel: string;
};

export type FrameworkQuestionsPayload = {
  kind: "canvasight.framework-questions";
  schemaVersion: 1;
  confirmationId: string;
  language: "zh" | "en";
  title: string;
  description?: string;
  questions: FrameworkQuestion[];
  instruction: "wait_for_user_confirmation";
};

export type FrameworkQuestionAnswer = {
  questionId: string;
  selectedOptionIds: string[];
  customAnswer: string;
};

export function isFrameworkQuestionsPayload(value: unknown): value is FrameworkQuestionsPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<FrameworkQuestionsPayload>;
  return (
    payload.kind === "canvasight.framework-questions" &&
    payload.schemaVersion === 1 &&
    typeof payload.confirmationId === "string" &&
    typeof payload.title === "string" &&
    (payload.language === "zh" || payload.language === "en") &&
    Array.isArray(payload.questions) &&
    payload.questions.length >= 1 &&
    payload.questions.length <= 3
  );
}

export function buildFrameworkConfirmationMessage(
  payload: FrameworkQuestionsPayload,
  answers: FrameworkQuestionAnswer[]
): string {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const lines = [
    "Canvasight framework confirmation",
    `confirmationId: ${payload.confirmationId}`,
    "answers:"
  ];
  for (const question of payload.questions) {
    const answer = answerByQuestion.get(question.id);
    const optionById = new Map(question.options.map((option) => [option.id, option.label]));
    const selectedOptionIds = answer?.selectedOptionIds ?? [];
    const selectedOptions = selectedOptionIds.map((id) => `${id} (${optionById.get(id) ?? id})`);
    lines.push(`- questionId: ${question.id}`);
    lines.push(`  selectedOptionIds: ${JSON.stringify(selectedOptionIds)}`);
    lines.push(`  selectedOptions: ${selectedOptions.length ? selectedOptions.join(", ") : "none"}`);
    lines.push(`  customAnswer: ${JSON.stringify(answer?.customAnswer ?? "")}`);
  }
  lines.push("");
  lines.push(
    payload.language === "en"
      ? "Continue the original Canvasight Graph Writer request with these answers. Do not ask answered questions again. Before writing, call get_canvasight_graph_context again and use the new context and revision."
      : "请使用这些答案继续原 Canvasight Graph Writer 请求；不要重复询问已回答项。写入前重新调用 get_canvasight_graph_context，并使用新的 context 与 revision。"
  );
  return lines.join("\n");
}
