import clsx from "clsx";
import type { CSSProperties, ReactElement } from "react";

const svgModules = import.meta.glob("../../assets/icons/**/*.svg", {
  eager: true,
  import: "default",
  query: "?raw"
}) as Record<string, string>;

const appIconAliases: Record<string, string> = {
  "chevron-down": "chevron-down-md",
  "external-link": "link-external",
  "file-down": "download",
  "file-text": "notepad",
  "image-icon": "image-square",
  inbox: "folder-stuffed",
  layers: "stack",
  "list-checks": "tasks",
  "panel-right-open": "sidebar-right-expand",
  save: "status"
};

function normalizeIconKey(value: string): string {
  return value.trim().replace(/\\/g, "/").replace(/\.svg$/i, "").toLowerCase();
}

function iconBaseName(value: string): string {
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}

function prepareSvg(svg: string): string {
  return svg
    .replace(/<svg\b/i, '<svg focusable="false" aria-hidden="true"')
    .replace(/(fill|stroke)="#7D7D7D"/gi, '$1="currentColor"');
}

function buildIconRegistry(): Record<string, string> {
  const registry: Record<string, string> = {};
  const aliasEntries: Array<[string, string]> = [];

  Object.entries(svgModules).forEach(([path, rawSvg]) => {
    const svg = prepareSvg(rawSvg);
    const relativePath = normalizeIconKey(path.replace(/^.*\/assets\/icons\//, ""));
    const baseName = iconBaseName(relativePath);

    registry[relativePath] = svg;
    registry[baseName] = svg;

    baseName.split(",").forEach((alias) => {
      aliasEntries.push([normalizeIconKey(alias), svg]);
    });
  });

  aliasEntries.forEach(([alias, svg]) => {
    if (alias && !registry[alias]) {
      registry[alias] = svg;
    }
  });

  return registry;
}

const iconRegistry = buildIconRegistry();

export const iconNames = Object.freeze(Object.keys(iconRegistry).sort());

export interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  "aria-label"?: string;
}

export function Icon({ name, size = 16, className, style, title, "aria-label": ariaLabel }: IconProps): ReactElement {
  const normalizedName = normalizeIconKey(name);
  const resolvedName = appIconAliases[normalizedName] || normalizedName;
  const svg = iconRegistry[normalizeIconKey(resolvedName)];
  const label = ariaLabel || title;
  const iconStyle: CSSProperties = {
    width: size,
    height: size,
    ...style
  };

  if (!svg) {
    return (
      <span
        className={clsx("app-icon", "app-icon-missing", className)}
        style={iconStyle}
        title={title}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      />
    );
  }

  return (
    <span
      className={clsx("app-icon", className)}
      style={iconStyle}
      title={title}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
