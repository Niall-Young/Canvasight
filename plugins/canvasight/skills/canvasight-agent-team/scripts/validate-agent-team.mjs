#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "references/agent-team-schema.json"), "utf8"));
const timestamp = new RegExp(schema.timestamp.pattern);
const parseScalar = (value) => value === "null" ? null : value === "true" ? true : value === "false" ? false : /^\d+$/.test(value) ? Number(value) : value === "[]" ? [] : value;
const required = (object, fields, label, errors) => fields.forEach((field) => { if (!Object.hasOwn(object, field)) errors.push(`${label}: missing ${field}`); });

function usage() { console.error("Usage: node scripts/validate-agent-team.mjs --root <project-root>"); }
function yamlBlock(content, label) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${label}: missing YAML frontmatter`);
  const output = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matchLine = line.match(/^([a-z_]+):(?:\s*(.*))?$/);
    if (!matchLine) throw new Error(`${label}:${index + 1}: unsupported YAML`);
    const [, key, raw = ""] = matchLine;
    if (raw) output[key] = parseScalar(raw);
    else {
      const values = [];
      while (/^  - /.test(lines[index + 1] || "")) values.push(parseScalar(lines[++index].slice(4)));
      output[key] = values.length ? values : null;
    }
  }
  return output;
}

function readRoster(projectRoot) {
  const file = path.join(projectRoot, "ROSTER.md");
  if (!fs.existsSync(file)) throw new Error("ROSTER.md is required");
  const block = fs.readFileSync(file, "utf8").match(/```yaml\r?\n([\s\S]*?)\r?\n```/);
  if (!block) throw new Error("ROSTER.md must contain a YAML registry block");
  const roles = [];
  let current = null;
  let version = null;
  for (const line of block[1].split(/\r?\n/)) {
    if (line === "roles:" || !line.trim()) continue;
    const top = line.match(/^schema_version:\s*(.+)$/);
    const first = line.match(/^  - ([a-z_]+):\s*(.*)$/);
    const nested = line.match(/^    ([a-z_]+):\s*(.*)$/);
    if (top) version = parseScalar(top[1]);
    else if (first) { current = { [first[1]]: parseScalar(first[2]) }; roles.push(current); }
    else if (nested && current) current[nested[1]] = parseScalar(nested[2]);
    else throw new Error(`ROSTER.md: unsupported YAML line ${line}`);
  }
  return { version, roles };
}

function reports(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? reports(path.join(directory, entry.name)) : entry.name.endsWith(".md") && entry.name !== "QUEUE.md" ? [path.join(directory, entry.name)] : []);
}

function validate(projectRoot) {
  const errors = [];
  let roster;
  try { roster = readRoster(projectRoot); } catch (error) { return [error.message]; }
  if (roster.version !== schema.schema_version) errors.push("ROSTER.md: schema_version must match");
  if (!roster.roles.length) errors.push("ROSTER.md: roles must not be empty");
  const roleNames = new Set();
  for (const role of roster.roles) {
    required(role, schema.roster.required_fields, "ROSTER.md", errors);
    if (!schema.roles.includes(role.role)) errors.push(`ROSTER.md: invalid role ${role.role}`);
    if (roleNames.has(role.role)) errors.push(`ROSTER.md: duplicate role ${role.role}`);
    roleNames.add(role.role);
    if (!schema.roster.statuses.includes(role.status)) errors.push(`ROSTER.md: invalid status ${role.status}`);
    if (!timestamp.test(role.created_at || "") || !timestamp.test(role.last_seen || "")) errors.push(`ROSTER.md: ${role.role} timestamps must be RFC 3339 UTC`);
  }
  const reportFiles = reports(path.join(projectRoot, "agent-reports"));
  const active = [];
  const ids = new Set();
  for (const file of reportFiles) {
    const label = path.relative(projectRoot, file).split(path.sep).join("/");
    let metadata;
    try { metadata = yamlBlock(fs.readFileSync(file, "utf8"), label); } catch (error) { errors.push(error.message); continue; }
    required(metadata, schema.reports.required_fields, label, errors);
    const type = schema.reports.types[metadata.report_type];
    if (!type) { errors.push(`${label}: invalid report_type`); continue; }
    const id = path.basename(file, ".md");
    if (metadata.report_id !== id || !new RegExp(`^${type.prefix}[a-z0-9]+(?:-[a-z0-9]+)*$`).test(id)) errors.push(`${label}: report_id must match kebab-case filename`);
    if (ids.has(metadata.report_id)) errors.push(`${label}: duplicate report_id`); ids.add(metadata.report_id);
    if (!type.allowed_statuses.includes(metadata.status)) errors.push(`${label}: invalid status`);
    if (!schema.roles.includes(metadata.owner) && !schema.reserved_roles.includes(metadata.owner)) errors.push(`${label}: invalid owner`);
    if (!schema.roles.includes(metadata.created_by) && !schema.reserved_roles.includes(metadata.created_by)) errors.push(`${label}: invalid created_by`);
    if (!Number.isInteger(metadata.version) || metadata.version < 1) errors.push(`${label}: version must be positive`);
    if (!timestamp.test(metadata.created_at || "") || !timestamp.test(metadata.updated_at || "")) errors.push(`${label}: timestamps must be RFC 3339 UTC`);
    if (!schema.reports.verification_by_status[metadata.status]?.includes(metadata.verification_status)) errors.push(`${label}: invalid verification status`);
    if (metadata.verification_status === "passed" && (!Array.isArray(metadata.verification_evidence) || !metadata.verification_evidence.length)) errors.push(`${label}: passed verification requires evidence`);
    if (schema.queue.active_issue_statuses.includes(metadata.status)) active.push({ id: metadata.report_id, metadata, label, title: fs.readFileSync(file, "utf8").match(/^#\s+(.+)$/m)?.[1] || "" });
  }
  const queue = path.join(projectRoot, "agent-reports/QUEUE.md");
  if (fs.existsSync(queue)) {
    const lines = fs.readFileSync(queue, "utf8").split(/\r?\n/).filter((line) => line.startsWith("|"));
    const header = lines.shift()?.split("|").map((cell) => cell.trim()).filter(Boolean) || [];
    if (header.join("|") !== schema.queue.columns.join("|")) errors.push("QUEUE.md: columns must match schema");
    const rows = lines.slice(1).filter((line) => !/^\|\s*-/.test(line)).map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
    if (rows.length !== active.length) errors.push("QUEUE.md: must index exactly active issues");
    for (const report of active) if (!rows.some((row) => row[0] === report.id && row[1] === report.metadata.status && row[6] === String(report.metadata.version))) errors.push(`QUEUE.md: ${report.id} differs from report`);
  }
  return errors;
}

if (process.argv.length !== 4 || process.argv[2] !== "--root") { usage(); process.exit(2); }
const errors = validate(path.resolve(process.argv[3]));
if (errors.length) { console.error(`Agent Team validation failed for ${path.resolve(process.argv[3])}:`); errors.forEach((error) => console.error(`- ${error}`)); process.exit(1); }
console.log(`Agent Team validation passed for ${path.resolve(process.argv[3])}.`);
