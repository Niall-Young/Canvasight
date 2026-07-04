import type { AchievementId } from "../../shared/types";
import type { TranslationKey } from "./translations";
import codexRookieAlpha from "../assets/achievements/codex-rookie-alpha.png";
import codexRookieDefault from "../assets/achievements/codex-rookie-default.png";
import codexRookieFade from "../assets/achievements/codex-rookie-fade.png";
import doubleTakeAlpha from "../assets/achievements/double-take-alpha.png";
import doubleTakeDefault from "../assets/achievements/double-take-default.png";
import doubleTakeFade from "../assets/achievements/double-take-fade.png";
import goneInAFlashAlpha from "../assets/achievements/gone-in-a-flash-alpha.png";
import goneInAFlashDefault from "../assets/achievements/gone-in-a-flash-default.png";
import goneInAFlashFade from "../assets/achievements/gone-in-a-flash-fade.png";
import gunslingerAlpha from "../assets/achievements/gunslinger-alpha.png";
import gunslingerDefault from "../assets/achievements/gunslinger-default.png";
import gunslingerFade from "../assets/achievements/gunslinger-fade.png";
import ideaOverlordAlpha from "../assets/achievements/idea-overlord-alpha.png";
import ideaOverlordDefault from "../assets/achievements/idea-overlord-default.png";
import ideaOverlordFade from "../assets/achievements/idea-overlord-fade.png";
import masterBuilderAlpha from "../assets/achievements/master-builder-alpha.png";
import masterBuilderDefault from "../assets/achievements/master-builder-default.png";
import masterBuilderFade from "../assets/achievements/master-builder-fade.png";
import oneshotAlpha from "../assets/achievements/oneshot-alpha.png";
import oneshotDefault from "../assets/achievements/oneshot-default.png";
import oneshotFade from "../assets/achievements/oneshot-fade.png";
import threeMusketeersAlpha from "../assets/achievements/three-musketeers-alpha.png";
import threeMusketeersDefault from "../assets/achievements/three-musketeers-default.png";
import threeMusketeersFade from "../assets/achievements/three-musketeers-fade.png";

export const achievementsPerRow = 4;

export const achievements = [
  {
    id: "oneshot",
    image: oneshotAlpha,
    backgroundImage: oneshotDefault,
    lockedImage: oneshotFade,
    englishName: "Oneshot",
    titleKey: "achievements.item.oneshot",
    conditionKey: "achievements.condition.oneshot"
  },
  {
    id: "gunslinger",
    image: gunslingerAlpha,
    backgroundImage: gunslingerDefault,
    lockedImage: gunslingerFade,
    englishName: "Gunslinger",
    titleKey: "achievements.item.gunslinger",
    conditionKey: "achievements.condition.gunslinger"
  },
  {
    id: "three-musketeers",
    image: threeMusketeersAlpha,
    backgroundImage: threeMusketeersDefault,
    lockedImage: threeMusketeersFade,
    englishName: "Three Musketeers",
    titleKey: "achievements.item.threeMusketeers",
    conditionKey: "achievements.condition.threeMusketeers"
  },
  {
    id: "codex-rookie",
    image: codexRookieAlpha,
    backgroundImage: codexRookieDefault,
    lockedImage: codexRookieFade,
    englishName: "Codex Rookie",
    titleKey: "achievements.item.codexRookie",
    conditionKey: "achievements.condition.codexRookie"
  },
  {
    id: "double-take",
    image: doubleTakeAlpha,
    backgroundImage: doubleTakeDefault,
    lockedImage: doubleTakeFade,
    englishName: "Double Take",
    titleKey: "achievements.item.doubleTake",
    conditionKey: "achievements.condition.doubleTake"
  },
  {
    id: "idea-overlord",
    image: ideaOverlordAlpha,
    backgroundImage: ideaOverlordDefault,
    lockedImage: ideaOverlordFade,
    englishName: "Idea Overlord",
    titleKey: "achievements.item.ideaOverlord",
    conditionKey: "achievements.condition.ideaOverlord"
  },
  {
    id: "master-builder",
    image: masterBuilderAlpha,
    backgroundImage: masterBuilderDefault,
    lockedImage: masterBuilderFade,
    englishName: "Master Builder",
    titleKey: "achievements.item.masterBuilder",
    conditionKey: "achievements.condition.masterBuilder"
  },
  {
    id: "gone-in-a-flash",
    image: goneInAFlashAlpha,
    backgroundImage: goneInAFlashDefault,
    lockedImage: goneInAFlashFade,
    englishName: "Gone in a Flash",
    titleKey: "achievements.item.goneInAFlash",
    conditionKey: "achievements.condition.goneInAFlash"
  }
] satisfies Array<{
  id: AchievementId;
  image: string;
  backgroundImage: string;
  lockedImage: string;
  englishName: string;
  titleKey: TranslationKey;
  conditionKey: TranslationKey;
}>;

export type AchievementDefinition = (typeof achievements)[number];

export function achievementById(id: AchievementId): AchievementDefinition | null {
  return achievements.find((achievement) => achievement.id === id) ?? null;
}
