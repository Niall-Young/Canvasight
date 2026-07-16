import type { SkillSummary } from "./canvasightApi";

export interface SkillQueryRange {
  start: number;
  end: number;
  query: string;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function findSkillQuery(value: string, selectionStart: number | null, selectionEnd: number | null): SkillQueryRange | null {
  if (selectionStart === null || selectionEnd === null || selectionStart !== selectionEnd) return null;
  const prefix = value.slice(0, selectionStart);
  const match = prefix.match(/(?:^|\s)\$([\p{L}_][\p{L}\p{N}_.:/-]*)?$/u);
  if (!match) return null;
  const start = prefix.lastIndexOf("$");
  let end = selectionStart;
  while (end < value.length && !/\s/u.test(value[end])) end += 1;
  return { start, end, query: match[1] ?? "" };
}

function skillScore(skill: SkillSummary, query: string): number {
  if (!query) return 1;
  const name = normalized(skill.name);
  const displayName = normalized(skill.displayName);
  const description = normalized(skill.description);
  if (name === query) return 100;
  if (name.startsWith(query)) return 80;
  if (displayName.startsWith(query)) return 70;
  if (name.includes(query)) return 60;
  if (displayName.includes(query)) return 50;
  if (description.includes(query)) return 30;
  return 0;
}

export function filterSkills(skills: SkillSummary[], query: string, limit = Number.POSITIVE_INFINITY): SkillSummary[] {
  const needle = normalized(query);
  return skills
    .map((skill, index) => ({ skill, index, score: skillScore(skill, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((entry) => entry.skill);
}

export function insertSkillToken(
  value: string,
  range: SkillQueryRange,
  skillName: string
): { value: string; caret: number } {
  const token = `$${skillName} `;
  return {
    value: `${value.slice(0, range.start)}${token}${value.slice(range.end)}`,
    caret: range.start + token.length
  };
}
