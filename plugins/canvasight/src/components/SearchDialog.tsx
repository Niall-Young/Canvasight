import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import type { ScatterProjectInfo } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { shortPath } from "../lib/utils";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { ProjectItem } from "./ui/project-item";

interface SearchDialogProps {
  onOpenChange: (open: boolean) => void;
  onOpenProject: (projectPath: string) => void | Promise<void>;
  open: boolean;
  projects: ScatterProjectInfo[];
}

export function SearchDialog({
  onOpenChange,
  onOpenProject,
  open,
  projects
}: SearchDialogProps): ReactElement {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const availableProjects = useMemo(() => projects.filter((project) => !project.missing), [projects]);
  const filteredProjects = useMemo(() => {
    if (!normalizedQuery) return availableProjects;
    return availableProjects.filter((project) => {
      const name = project.name.toLocaleLowerCase();
      const path = project.path.toLocaleLowerCase();
      return name.includes(normalizedQuery) || path.includes(normalizedQuery);
    });
  }, [availableProjects, normalizedQuery]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  function selectProject(projectPath: string): void {
    onOpenChange(false);
    void onOpenProject(projectPath);
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="search-dialog-overlay" />
        <RadixDialog.Content
          className="search-dialog-content"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <header className="search-dialog-header">
            <RadixDialog.Title className="search-dialog-title">{t("searchDialog.title")}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton className="search-dialog-close" filled={false} icon="x" size="sm" aria-label={t("searchDialog.close")} />
            </RadixDialog.Close>
          </header>

          <div className="search-dialog-body">
            <div className="search-dialog-search-row">
              <label className="search-dialog-search" aria-label={t("searchDialog.placeholder")}>
                <input
                  ref={inputRef}
                  className="search-dialog-input"
                  type="search"
                  placeholder={t("searchDialog.placeholder")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Icon name="search" size={16} />
              </label>
            </div>

            <div className="search-dialog-results" role="list" aria-label={t("searchDialog.results")}>
              {filteredProjects.map((project) => (
                <ProjectItem
                  key={project.path}
                  path={shortPath(project.path)}
                  projectName={project.name}
                  onClick={() => selectProject(project.path)}
                />
              ))}
              {filteredProjects.length === 0 ? (
                <p className="search-dialog-empty">
                  {projects.length === 0
                    ? t("searchDialog.empty")
                    : availableProjects.length === 0
                      ? t("searchDialog.noAvailableProjects")
                      : t("searchDialog.noResults")}
                </p>
              ) : null}
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
