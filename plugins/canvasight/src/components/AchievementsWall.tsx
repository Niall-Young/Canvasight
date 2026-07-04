import { useMemo, useState, type ChangeEvent, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import type { AchievementId } from "../../shared/types";
import type { AchievementState } from "../../shared/types";
import { achievements, achievementsPerRow, type AchievementDefinition } from "../lib/achievements";
import { useI18n } from "../lib/i18n";
import { Icon } from "./ui/icon";
import { KitButton } from "./ui/kit-button";

interface AchievementsWallProps {
  achievementState: AchievementState;
}

export function AchievementsWall({ achievementState }: AchievementsWallProps): ReactElement {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedAchievementId, setSelectedAchievementId] = useState<AchievementId | null>(null);

  const visibleAchievements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return achievements;

    return achievements.filter((achievement) => {
      const title = t(achievement.titleKey).toLowerCase();
      const condition = t(achievement.conditionKey).toLowerCase();
      const achievedAt = achievementState.unlockedAt[achievement.id] ?? "";
      return (
        title.includes(normalizedQuery) ||
        achievement.englishName.toLowerCase().includes(normalizedQuery) ||
        condition.includes(normalizedQuery) ||
        achievedAt.includes(normalizedQuery)
      );
    });
  }, [achievementState.unlockedAt, query, t]);

  const achievementRows = useMemo(() => {
    const rows: AchievementDefinition[][] = [];
    for (let index = 0; index < visibleAchievements.length; index += achievementsPerRow) {
      rows.push(visibleAchievements.slice(index, index + achievementsPerRow));
    }
    return rows;
  }, [visibleAchievements]);

  const selectedAchievement = useMemo(
    () => achievements.find((achievement) => achievement.id === selectedAchievementId) ?? null,
    [selectedAchievementId]
  );
  const selectedAchievedAt = selectedAchievement ? achievementState.unlockedAt[selectedAchievement.id] : undefined;

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>): void {
    setQuery(event.target.value);
  }

  return (
    <section className="achievements-wall" aria-label={t("achievements.title")}>
      <div className="achievements-wall-header">
        <h1 className="achievements-wall-title">{t("achievements.title")}</h1>
        <label className="achievements-search">
          <span className="sr-only">{t("achievements.searchLabel")}</span>
          <input
            className="achievements-search-input"
            type="search"
            value={query}
            placeholder={t("achievements.searchPlaceholder")}
            onChange={handleQueryChange}
          />
          <Icon name="search" size={16} />
        </label>
      </div>
      {visibleAchievements.length ? (
        <div className="achievements-scroll">
          <div className="achievements-records">
            {achievementRows.map((row, rowIndex) => (
              <div className="achievements-row" key={row.map((achievement) => achievement.id).join("-") || rowIndex}>
                {row.map((achievement) => {
                  const achievedAt = achievementState.unlockedAt[achievement.id];
                  const title = t(achievement.titleKey);
                  const cardContent = (
                    <>
                      <div className="achievement-image-frame">
                        <img src={achievedAt ? achievement.image : achievement.lockedImage} alt="" />
                      </div>
                      <div className="achievement-card-content">
                        <h2>{title}</h2>
                        <p>{achievedAt ?? t(achievement.conditionKey)}</p>
                      </div>
                    </>
                  );

                  if (!achievedAt) {
                    return (
                      <article className="achievement-card is-locked" key={achievement.id}>
                        {cardContent}
                      </article>
                    );
                  }

                  return (
                    <button
                      className="achievement-card is-unlocked"
                      key={achievement.id}
                      type="button"
                      aria-label={t("achievements.openDetail", { name: title })}
                      onClick={() => setSelectedAchievementId(achievement.id)}
                    >
                      {cardContent}
                    </button>
                  );
                })}
                {row.length < achievementsPerRow
                  ? Array.from({ length: achievementsPerRow - row.length }).map((_, index) => (
                      <div className="achievement-card-spacer" key={`spacer-${rowIndex}-${index}`} aria-hidden="true" />
                    ))
                  : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="achievements-empty">{t("achievements.empty")}</p>
      )}
      <RadixDialog.Root
        open={Boolean(selectedAchievement && selectedAchievedAt)}
        onOpenChange={(open) => {
          if (!open) setSelectedAchievementId(null);
        }}
      >
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="achievement-dialog-overlay" />
          {selectedAchievement && selectedAchievedAt ? (
            <RadixDialog.Content className="achievement-dialog-content">
              <div className="achievement-dialog-image-frame">
                <img src={selectedAchievement.backgroundImage} alt="" />
              </div>
              <div className="achievement-dialog-copy">
                <div className="achievement-dialog-info">
                  <RadixDialog.Title className="achievement-dialog-title">
                    {t(selectedAchievement.titleKey)}
                  </RadixDialog.Title>
                  <RadixDialog.Description className="achievement-dialog-condition">
                    {t(selectedAchievement.conditionKey)}
                  </RadixDialog.Description>
                </div>
                <p className="achievement-dialog-date">{selectedAchievedAt}</p>
              </div>
              <RadixDialog.Close asChild>
                <KitButton className="achievement-dialog-button" filled size="lg">
                  {t("achievements.dialog.keepGoing")}
                </KitButton>
              </RadixDialog.Close>
            </RadixDialog.Content>
          ) : null}
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </section>
  );
}
