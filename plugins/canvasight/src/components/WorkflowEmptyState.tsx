import type { ReactElement } from "react";
import { useI18n } from "../lib/i18n";
import { Icon } from "./ui/icon";

export function WorkflowEmptyState({ onCreateTask }: { onCreateTask: () => void }): ReactElement {
  const { t } = useI18n();

  return (
    <section className="workflow-empty-state" aria-labelledby="workflow-empty-title">
      <div>
        <h2 id="workflow-empty-title">{t("workflow.empty.title")}</h2>
        <p>{t("workflow.empty.description")}</p>
        <button type="button" onClick={onCreateTask}><Icon name="plus-lg" size={16} />{t("workflow.empty.action")}</button>
      </div>
    </section>
  );
}
