import { useRef, useState, type DragEvent, type ReactElement } from "react";
import type { ScatterProjectInfo } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { shortPath } from "../lib/utils";
import { Icon } from "./ui/icon";
import { ProjectItem } from "./ui/project-item";

interface SidebarProps {
  recentProjects: ScatterProjectInfo[];
  activePath?: string;
  achievementsActive?: boolean;
  collapsed?: boolean;
  onCreateProject: () => void;
  onOpenAchievements: () => void;
  onOpenRecent: (projectPath: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onRemoveRecent: (projectPath: string) => void;
  onReorderRecent: (projectPaths: string[]) => void | Promise<void>;
}

function moveProject(projects: ScatterProjectInfo[], sourcePath: string, targetPath: string, placement: "before" | "after"): ScatterProjectInfo[] {
  const source = projects.find((project) => project.path === sourcePath);
  if (!source || sourcePath === targetPath) return projects;

  const withoutSource = projects.filter((project) => project.path !== sourcePath);
  const targetIndex = withoutSource.findIndex((project) => project.path === targetPath);
  if (targetIndex < 0) return projects;

  const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;
  const next = [...withoutSource];
  next.splice(insertIndex, 0, source);
  return next;
}

function sameProjectOrder(left: ScatterProjectInfo[], right: ScatterProjectInfo[]): boolean {
  return left.length === right.length && left.every((project, index) => project.path === right[index]?.path);
}

export function Sidebar({
  recentProjects,
  activePath,
  achievementsActive = false,
  collapsed = false,
  onCreateProject,
  onOpenAchievements,
  onOpenRecent,
  onOpenSearch,
  onOpenSettings,
  onRemoveRecent,
  onReorderRecent
}: SidebarProps): ReactElement {
  const { t } = useI18n();
  const [draggedProjectPath, setDraggedProjectPath] = useState<string | null>(null);
  const [dragOverProjectPath, setDragOverProjectPath] = useState<string | null>(null);
  const [dragProjects, setDragProjects] = useState<ScatterProjectInfo[] | null>(null);
  const dragProjectsRef = useRef<ScatterProjectInfo[] | null>(null);
  const draggedProjectPathRef = useRef<string | null>(null);
  const originalDragProjectsRef = useRef<ScatterProjectInfo[]>([]);
  const suppressClickPathRef = useRef<string | null>(null);
  const visibleProjects = dragProjects ?? recentProjects;

  function startProjectDrag(event: DragEvent<HTMLDivElement>, project: ScatterProjectInfo): void {
    if (project.missing || (event.target instanceof Element && event.target.closest(".kit-project-item-archive"))) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", project.path);
    draggedProjectPathRef.current = project.path;
    originalDragProjectsRef.current = recentProjects;
    dragProjectsRef.current = recentProjects;
    suppressClickPathRef.current = project.path;
    setDraggedProjectPath(project.path);
    setDragProjects(recentProjects);
  }

  function moveDraggedProject(targetPath: string, placement: "before" | "after"): void {
    const sourcePath = draggedProjectPathRef.current;
    if (!sourcePath || sourcePath === targetPath) return;

    setDragOverProjectPath(targetPath);
    setDragProjects((current) => {
      const base = current ?? recentProjects;
      const next = moveProject(base, sourcePath, targetPath, placement);
      if (sameProjectOrder(next, base)) return current;
      dragProjectsRef.current = next;
      return next;
    });
  }

  function finishProjectDrag(): void {
    const draggedPath = draggedProjectPathRef.current;
    const finalProjects = dragProjectsRef.current;
    const originalProjects = originalDragProjectsRef.current;

    draggedProjectPathRef.current = null;
    dragProjectsRef.current = null;
    originalDragProjectsRef.current = [];
    setDraggedProjectPath(null);
    setDragOverProjectPath(null);
    setDragProjects(null);

    if (draggedPath) {
      window.setTimeout(() => {
        if (suppressClickPathRef.current === draggedPath) {
          suppressClickPathRef.current = null;
        }
      }, 0);
    }

    if (finalProjects && !sameProjectOrder(finalProjects, originalProjects)) {
      void onReorderRecent(finalProjects.map((project) => project.path));
    }
  }

  function openProject(project: ScatterProjectInfo): void {
    if (suppressClickPathRef.current === project.path) {
      suppressClickPathRef.current = null;
      return;
    }
    if (project.missing) return;
    onOpenRecent(project.path);
  }

  return (
    <aside className="sidebar" aria-hidden={collapsed} inert={collapsed}>
      <div className="sidebar-actions">
        <button className="sidebar-action-item" type="button" onClick={onCreateProject}>
          <Icon name="folder-plus" size={16} />
          <span className="sidebar-action-label">{t("sidebar.addProject")}</span>
        </button>
        <button className="sidebar-action-item" type="button" onClick={onOpenSearch}>
          <Icon name="search" size={16} />
          <span className="sidebar-action-label">{t("sidebar.search")}</span>
        </button>
        <button
          className={`sidebar-action-item ${achievementsActive ? "is-selected" : ""}`}
          type="button"
          aria-pressed={achievementsActive}
          onClick={onOpenAchievements}
        >
          <Icon name="lightbulb-glow" size={16} />
          <span className="sidebar-action-label">{t("sidebar.achievements")}</span>
        </button>
        <button className="sidebar-action-item" type="button" onClick={onOpenSettings}>
          <Icon name="settings-cog" size={16} />
          <span className="sidebar-action-label">{t("sidebar.settings")}</span>
        </button>
      </div>

      <div className="sidebar-section-title">{t("sidebar.projectList")}</div>
      <div className="project-list">
        {visibleProjects.map((project) => (
          <ProjectItem
            key={project.path}
            disabled={project.missing}
            draggableItem
            dragging={draggedProjectPath === project.path}
            dragOver={dragOverProjectPath === project.path && draggedProjectPath !== project.path}
            path={shortPath(project.path)}
            projectName={project.name}
            selected={!project.missing && project.path === activePath}
            onClick={() => openProject(project)}
            onArchive={() => onRemoveRecent(project.path)}
            onItemDragEnd={finishProjectDrag}
            onItemDragEnter={(event) => {
              if (!draggedProjectPathRef.current) return;
              event.preventDefault();
              setDragOverProjectPath(project.path);
            }}
            onItemDragOver={(event) => {
              if (!draggedProjectPathRef.current) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              const rect = event.currentTarget.getBoundingClientRect();
              moveDraggedProject(project.path, event.clientY > rect.top + rect.height / 2 ? "after" : "before");
            }}
            onItemDragStart={(event) => startProjectDrag(event, project)}
            onItemDrop={(event) => {
              if (!draggedProjectPathRef.current) return;
              event.preventDefault();
              event.stopPropagation();
              finishProjectDrag();
            }}
          />
        ))}
      </div>
    </aside>
  );
}
