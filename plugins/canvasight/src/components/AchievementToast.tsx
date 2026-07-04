import type { ReactElement } from "react";
import type { AchievementDefinition } from "../lib/achievements";
import { useI18n } from "../lib/i18n";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";
import { ToastViewport } from "./ui/toast";

interface AchievementToastProps {
  achievement: AchievementDefinition;
  onClose: () => void;
  onView: () => void;
}

export function AchievementToast({ achievement, onClose, onView }: AchievementToastProps): ReactElement {
  const { t } = useI18n();
  const name = t(achievement.titleKey);

  return (
    <ToastViewport>
      <div className="achievement-toast" role="status" aria-live="polite">
        <div className="achievement-toast-main">
          <img className="achievement-toast-image" src={achievement.backgroundImage} alt="" />
          <div className="achievement-toast-copy">
            <p className="achievement-toast-title">{t("achievements.toast.title", { name })}</p>
            <p className="achievement-toast-description">{t(achievement.conditionKey)}</p>
          </div>
        </div>
        <div className="achievement-toast-actions">
          <Button className="achievement-toast-view" variant="primary" size="sm" onClick={onView}>
            {t("achievements.toast.view")}
          </Button>
          <IconButton
            className="achievement-toast-close"
            filled={false}
            icon="x"
            size="lg"
            aria-label={t("achievements.toast.close")}
            onClick={onClose}
          />
        </div>
      </div>
    </ToastViewport>
  );
}
