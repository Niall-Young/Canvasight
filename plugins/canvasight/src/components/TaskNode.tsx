import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Attachment, BodyImageAnchor, RunMode, ScatterNodeData } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import type { SkillSummary } from "../lib/canvasightApi";
import { placeSkillPicker, type SkillPickerPosition } from "../lib/skillPickerPlacement";
import { shortcuts } from "../lib/shortcuts";
import { filterSkills, findSkillQuery, insertSkillToken, type SkillQueryRange } from "../lib/skills";
import { resolveBodyImageAnchors, richNodeSemanticSignature, shiftImageAnchorsForReplacement } from "../lib/richNodeContent";
import { formatBytes } from "../lib/utils";
import { useScatterStore } from "../store/scatterStore";
import { ActionMenuItem } from "./ui/action-menu-item";
import { IconButton } from "./ui/icon-button";
import { Icon } from "./ui/icon";
import { TooltipAnchor } from "./ui/tooltip";
import { UploadChip } from "./ui/upload-chip";
import {
  getRichNodeSelectionOffset,
  measureRichNodeCaretRect,
  renderRichNodeEditor,
  RichNodeBody,
  serializeRichNodeEditor,
  setRichNodeSelectionOffset
} from "./RichNodeBody";

type TaskNodeProps = NodeProps<Node<ScatterNodeData, "task">>;
type EditableField = "title" | "body";
type ConnectedNodeSide = "left" | "right";

interface RuntimeActions {
  updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => void;
  beginNodeEdit: () => void;
  commitNodeEdit: () => void;
  chooseFilesForNode: (nodeId: string, imageAnchorOffset?: number) => Promise<void>;
  addFilesToNode: (nodeId: string, files: FileList | File[], source: "upload" | "drop" | "paste", imageAnchorOffset?: number) => Promise<void>;
  removeAttachment: (nodeId: string, attachmentId: string) => void;
  createConnectedNode: (nodeId: string, side: ConnectedNodeSide) => void;
  duplicateNode: (nodeId: string) => void;
  saveNodeAsTemplate: (nodeId: string, data: ScatterNodeData) => Promise<void>;
  deleteNode: (nodeId: string) => void;
  setNodeHover: (nodeId: string, hovered: boolean) => void;
  runNode: (nodeId: string, mode: RunMode) => Promise<void>;
  listSkills: (forceReload?: boolean) => Promise<SkillSummary[]>;
}

export let taskNodeActions: RuntimeActions | null = null;

export function setTaskNodeActions(actions: RuntimeActions): void {
  taskNodeActions = actions;
}

function TaskAttachmentChip({ attachment, nodeId, assetBaseUrl }: { attachment: Attachment; nodeId: string; assetBaseUrl: string }): ReactElement {
  const [imageSrc, setImageSrc] = useState("");
  const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "ready" | "error">(attachment.kind === "image" ? "loading" : "idle");

  useEffect(() => {
    let current = true;
    setImageSrc("");
    if (attachment.kind !== "image") return () => { current = false; };
    setImageStatus("loading");
    void loadCanvasightImageAsset(attachment.fileUrl, attachment.storedPath, assetBaseUrl)
      .then((nextImageSrc) => {
        if (current) {
          setImageSrc(nextImageSrc);
          setImageStatus("ready");
        }
      })
      .catch(() => {
        if (current) {
          setImageSrc("");
          setImageStatus("error");
        }
      });
    return () => { current = false; };
  }, [assetBaseUrl, attachment.fileUrl, attachment.kind, attachment.storedPath]);

  return (
    <UploadChip
      className="nodrag"
      fileName={attachment.originalName}
      imageAlt={attachment.originalName}
      imageLoading={attachment.kind === "image" && imageStatus === "loading"}
      imageSrc={attachment.kind === "image" ? imageSrc : undefined}
      kind={attachment.kind}
      title={`${attachment.storedPath} · ${formatBytes(attachment.size)}`}
      onDoubleClick={() => window.scatter.showInFolder(attachment.storedPath)}
      onRemove={() => {
        taskNodeActions?.removeAttachment(nodeId, attachment.id);
      }}
    />
  );
}

function TaskNodeComponent({ id, data, selected }: TaskNodeProps): ReactElement {
  const { t } = useI18n();
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const skillPickerRef = useRef<HTMLDivElement>(null);
  const skillOptionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pointerStartedSelectedRef = useRef(false);
  const suppressConnectButtonClickRef = useRef(false);
  const isComposingRef = useRef(false);
  const pendingFinishAfterCompositionRef = useRef(false);
  const pendingNodeInternalsUpdateRef = useRef(false);
  const bodySelectionOffsetRef = useRef(data.body.length);
  // Keep IME edits local until composition ends so store/autosave updates do not commit raw pinyin.
  const titleDraftRef = useRef(data.title);
  const bodyDraftRef = useRef(data.body);
  const bodyImageAnchorsDraftRef = useRef<BodyImageAnchor[] | undefined>(data.bodyImageAnchors);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [titleDraft, setTitleDraft] = useState(data.title);
  const [bodyDraft, setBodyDraft] = useState(data.body);
  const [bodyImageAnchorsDraft, setBodyImageAnchorsDraft] = useState<BodyImageAnchor[] | undefined>(data.bodyImageAnchors);
  const [skillQuery, setSkillQuery] = useState<SkillQueryRange | null>(null);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [skillStatus, setSkillStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [activeSkillIndex, setActiveSkillIndex] = useState(0);
  const [skillPickerPosition, setSkillPickerPosition] = useState<SkillPickerPosition | null>(null);
  const assetBaseUrl = useSyncExternalStore(subscribeCanvasightRuntimeData, getCanvasightAssetBaseUrl, getCanvasightAssetBaseUrl);

  const runMode = data.runMode || "flow";
  const hasBody = bodyDraft.trim().length > 0;
  const hasParent = useScatterStore((state) =>
    state.edges.some((edge) => edge.target === id && state.nodes.some((node) => node.id === edge.source))
  );
  const hasChild = useScatterStore((state) =>
    state.edges.some((edge) => edge.source === id && state.nodes.some((node) => node.id === edge.target))
  );
  const skillPickerId = `skill-picker-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const visibleSkills = useMemo(() => filterSkills(skills, skillQuery?.query ?? ""), [skillQuery?.query, skills]);
  const inlineImageIds = useMemo(
    () => new Set(resolveBodyImageAnchors(bodyDraft, bodyImageAnchorsDraft, data.attachments).map((anchor) => anchor.attachmentId)),
    [bodyDraft, bodyImageAnchorsDraft, data.attachments]
  );
  const fileAttachments = useMemo(
    () => data.attachments.filter((attachment) => attachment.kind !== "image" || !inlineImageIds.has(attachment.id)),
    [data.attachments, inlineImageIds]
  );

  const loadSkills = useCallback(async (forceReload = false) => {
    setSkillStatus("loading");
    try {
      const nextSkills = await taskNodeActions?.listSkills(forceReload);
      setSkills(nextSkills ?? []);
      setSkillStatus("ready");
    } catch {
      setSkillStatus("error");
    }
  }, []);

  const syncSkillQuery = useCallback((value: string, editor: HTMLDivElement) => {
    if (isComposingRef.current) {
      setSkillQuery(null);
      return;
    }
    const selectionOffset = getRichNodeSelectionOffset(editor);
    bodySelectionOffsetRef.current = selectionOffset ?? bodySelectionOffsetRef.current;
    editor.dataset.richSelectionOffset = String(bodySelectionOffsetRef.current);
    const nextQuery = findSkillQuery(value, selectionOffset, selectionOffset);
    setSkillQuery(nextQuery);
    if (nextQuery && skillStatus === "idle") void loadSkills();
  }, [loadSkills, skillStatus]);

  useEffect(() => {
    setActiveSkillIndex(0);
  }, [skillQuery?.query]);

  useEffect(() => {
    if (activeSkillIndex < visibleSkills.length) return;
    setActiveSkillIndex(Math.max(0, visibleSkills.length - 1));
  }, [activeSkillIndex, visibleSkills.length]);

  useEffect(() => {
    skillOptionRefs.current[activeSkillIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeSkillIndex, skillQuery?.query]);

  useLayoutEffect(() => {
    if (editingField !== "body" || !skillQuery) {
      setSkillPickerPosition(null);
      return;
    }
    let frame = 0;
    const updatePosition = () => {
      frame = 0;
      const anchor = bodyRef.current;
      const picker = skillPickerRef.current;
      if (!anchor || !picker) return;
      const caretRect = measureRichNodeCaretRect(anchor);
      if (!caretRect) return;
      const nextPosition = placeSkillPicker({
        anchorRect: caretRect,
        pickerHeight: picker.offsetHeight,
        pickerWidth: picker.offsetWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth
      });
      setSkillPickerPosition((current) =>
        current?.left === nextPosition.left && current.top === nextPosition.top && current.placement === nextPosition.placement
          ? current
          : nextPosition
      );
    };
    const schedulePositionUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updatePosition);
    };
    updatePosition();
    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("pointermove", schedulePositionUpdate, true);
    document.addEventListener("selectionchange", schedulePositionUpdate);
    document.addEventListener("wheel", schedulePositionUpdate, true);
    document.addEventListener("scroll", schedulePositionUpdate, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("pointermove", schedulePositionUpdate, true);
      document.removeEventListener("selectionchange", schedulePositionUpdate);
      document.removeEventListener("wheel", schedulePositionUpdate, true);
      document.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [editingField, skillQuery, skillStatus, visibleSkills.length]);

  useLayoutEffect(() => {
    if (isComposingRef.current) {
      pendingNodeInternalsUpdateRef.current = true;
      return;
    }
    updateNodeInternals(id);
  }, [bodyDraft, bodyImageAnchorsDraft, data.attachments, id, updateNodeInternals]);

  useEffect(() => {
    if (editingField === "title") return;
    titleDraftRef.current = data.title;
    setTitleDraft(data.title);
  }, [data.title, editingField]);

  useEffect(() => {
    if (editingField === "body") return;
    bodyDraftRef.current = data.body;
    setBodyDraft(data.body);
    bodyImageAnchorsDraftRef.current = data.bodyImageAnchors;
    setBodyImageAnchorsDraft(data.bodyImageAnchors);
  }, [data.body, data.bodyImageAnchors, editingField]);

  useEffect(() => {
    if (editingField !== "body" || data.body !== bodyDraftRef.current) return;
    if (JSON.stringify(data.bodyImageAnchors ?? []) === JSON.stringify(bodyImageAnchorsDraftRef.current ?? [])) return;
    bodyImageAnchorsDraftRef.current = data.bodyImageAnchors;
    setBodyImageAnchorsDraft(data.bodyImageAnchors);
  }, [data.attachments, data.body, data.bodyImageAnchors, editingField]);

  const isNodeEditableElement = useCallback(
    (target: EventTarget | null) => target === titleRef.current || target === bodyRef.current,
    []
  );

  const isNodeEditableFocused = useCallback(() => isNodeEditableElement(document.activeElement), [isNodeEditableElement]);

  const flushDraftToStore = useCallback(
    (field?: EditableField) => {
      const patch: Partial<ScatterNodeData> = {};

      if ((!field || field === "title") && titleDraftRef.current !== data.title) {
        patch.title = titleDraftRef.current;
      }

      if ((!field || field === "body") && bodyDraftRef.current !== data.body) {
        patch.body = bodyDraftRef.current;
      }
      if ((!field || field === "body") && JSON.stringify(bodyImageAnchorsDraftRef.current ?? []) !== JSON.stringify(data.bodyImageAnchors ?? [])) {
        patch.bodyImageAnchors = bodyImageAnchorsDraftRef.current;
      }

      if (Object.keys(patch).length > 0) {
        taskNodeActions?.updateNodeData(id, patch);
      }
    },
    [data.body, data.bodyImageAnchors, data.title, id]
  );

  const finishEditing = useCallback(
    (field?: EditableField) => {
      if (field && editingField !== field) return;
      pendingFinishAfterCompositionRef.current = false;
      flushDraftToStore(field ?? editingField ?? undefined);
      taskNodeActions?.commitNodeEdit();
      setEditingField(null);
    },
    [editingField, flushDraftToStore]
  );

  useEffect(() => {
    if (selected || !editingField) return;
    if (isNodeEditableFocused()) return;
    if (isComposingRef.current) {
      pendingFinishAfterCompositionRef.current = true;
      return;
    }
    finishEditing(editingField);
  }, [editingField, finishEditing, isNodeEditableFocused, selected]);

  useEffect(() => {
    if (editingField === "title") {
      titleRef.current?.focus();
      const valueLength = titleRef.current?.value.length ?? 0;
      titleRef.current?.setSelectionRange(valueLength, valueLength);
      return;
    }

    if (editingField === "body") {
      bodyRef.current?.focus();
      if (bodyRef.current) setRichNodeSelectionOffset(bodyRef.current, bodySelectionOffsetRef.current);
    }
  }, [editingField]);

  const handleEditablePointerDown = useCallback(() => {
    pointerStartedSelectedRef.current = selected;
  }, [selected]);

  const startEditing = useCallback(
    (field: EditableField) => {
      if (!pointerStartedSelectedRef.current) return;
      taskNodeActions?.beginNodeEdit();
      setEditingField(field);
    },
    []
  );

  const handleEditableFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLDivElement>, field: EditableField) => {
    if (editingField !== field) {
      event.currentTarget.blur();
    }
  }, [editingField]);

  const handleEditableBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement | HTMLDivElement>, field: EditableField) => {
      if (editingField !== field) return;
      if (isNodeEditableElement(event.relatedTarget)) return;
      if (isComposingRef.current) {
        pendingFinishAfterCompositionRef.current = true;
        return;
      }
      finishEditing(field);
    },
    [editingField, finishEditing, isNodeEditableElement]
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
    pendingFinishAfterCompositionRef.current = false;
    setSkillQuery(null);
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement | HTMLDivElement>) => {
    const field = event.currentTarget === titleRef.current ? "title" : "body";

    if (field === "title") {
      const value = (event.currentTarget as HTMLInputElement).value;
      titleDraftRef.current = value;
      setTitleDraft(value);
    } else {
      const editor = event.currentTarget as HTMLDivElement;
      const selectionOffset = getRichNodeSelectionOffset(editor) ?? bodySelectionOffsetRef.current;
      const next = serializeRichNodeEditor(editor);
      const value = next.body;
      bodyDraftRef.current = value;
      setBodyDraft(value);
      bodyImageAnchorsDraftRef.current = next.bodyImageAnchors;
      setBodyImageAnchorsDraft(next.bodyImageAnchors);
      editor.dataset.richBodyValue = value;
      editor.dataset.richAnchorsValue = JSON.stringify(next.bodyImageAnchors ?? []);
      pendingNodeInternalsUpdateRef.current = true;
      window.setTimeout(() => {
        if (!bodyRef.current) return;
        const nextSignature = richNodeSemanticSignature(bodyDraftRef.current, bodyImageAnchorsDraftRef.current, data.attachments);
        if (bodyRef.current.dataset.richSemanticSignature !== nextSignature) {
          renderRichNodeEditor(bodyRef.current, bodyDraftRef.current, bodyImageAnchorsDraftRef.current, data.attachments);
          bodyRef.current.focus();
          setRichNodeSelectionOffset(bodyRef.current, selectionOffset);
        }
        syncSkillQuery(bodyDraftRef.current, bodyRef.current);
      }, 0);
    }

    isComposingRef.current = false;
    flushDraftToStore(field);
    if (pendingNodeInternalsUpdateRef.current) {
      pendingNodeInternalsUpdateRef.current = false;
      updateNodeInternals(id);
    }
    if (!pendingFinishAfterCompositionRef.current) return;
    window.setTimeout(() => {
      if (!isNodeEditableFocused()) {
        finishEditing();
        return;
      }
      pendingFinishAfterCompositionRef.current = false;
    }, 0);
  }, [data.attachments, finishEditing, flushDraftToStore, id, isNodeEditableFocused, syncSkillQuery, updateNodeInternals]);

  const isChangeDuringComposition = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      isComposingRef.current || Boolean((event.nativeEvent as InputEvent).isComposing),
    []
  );

  const handleEditableKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.currentTarget === bodyRef.current && skillQuery) {
      if (event.key === "ArrowDown" && visibleSkills.length) {
        event.preventDefault();
        setActiveSkillIndex((current) => Math.min(visibleSkills.length - 1, current + 1));
        return;
      }
      if (event.key === "ArrowUp" && visibleSkills.length) {
        event.preventDefault();
        setActiveSkillIndex((current) => Math.max(0, current - 1));
        return;
      }
      if ((event.key === "PageDown" || event.key === "PageUp") && visibleSkills.length) {
        event.preventDefault();
        const direction = event.key === "PageDown" ? 1 : -1;
        setActiveSkillIndex((current) => Math.max(0, Math.min(visibleSkills.length - 1, current + direction * 4)));
        return;
      }
      if ((event.key === "Enter" || event.key === "Tab") && visibleSkills[activeSkillIndex]) {
        event.preventDefault();
        const selectedSkill = visibleSkills[activeSkillIndex];
        const next = insertSkillToken(bodyDraftRef.current, skillQuery, selectedSkill.name);
        const nextAnchors = shiftImageAnchorsForReplacement(
          bodyImageAnchorsDraftRef.current,
          skillQuery.start,
          skillQuery.end,
          next.caret - skillQuery.start
        );
        bodyDraftRef.current = next.value;
        setBodyDraft(next.value);
        bodyImageAnchorsDraftRef.current = nextAnchors;
        setBodyImageAnchorsDraft(nextAnchors);
        taskNodeActions?.updateNodeData(id, { body: next.value, bodyImageAnchors: nextAnchors });
        setSkillQuery(null);
        if (bodyRef.current) renderRichNodeEditor(bodyRef.current, next.value, nextAnchors, data.attachments);
        window.requestAnimationFrame(() => {
          bodyRef.current?.focus();
          if (bodyRef.current) setRichNodeSelectionOffset(bodyRef.current, next.caret);
        });
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSkillQuery(null);
        return;
      }
    }
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }, [activeSkillIndex, data.attachments, id, skillQuery, visibleSkills]);

  const handleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      titleDraftRef.current = value;
      setTitleDraft(value);

      if (!isChangeDuringComposition(event) && value !== data.title) {
        taskNodeActions?.updateNodeData(id, { title: value });
      }
    },
    [data.title, id, isChangeDuringComposition]
  );

  const handleBodyInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      const selectionOffset = getRichNodeSelectionOffset(event.currentTarget) ?? bodySelectionOffsetRef.current;
      const next = serializeRichNodeEditor(event.currentTarget);
      const value = next.body;
      const isComposing = isComposingRef.current || Boolean((event.nativeEvent as InputEvent).isComposing);
      bodyDraftRef.current = value;
      setBodyDraft(value);
      bodyImageAnchorsDraftRef.current = next.bodyImageAnchors;
      setBodyImageAnchorsDraft(next.bodyImageAnchors);
      event.currentTarget.dataset.richBodyValue = value;
      event.currentTarget.dataset.richAnchorsValue = JSON.stringify(next.bodyImageAnchors ?? []);
      pendingNodeInternalsUpdateRef.current = isComposing;

      if (!isComposing && value !== data.body) {
        taskNodeActions?.updateNodeData(id, { body: value, bodyImageAnchors: next.bodyImageAnchors });
      } else if (!isComposing && JSON.stringify(next.bodyImageAnchors ?? []) !== JSON.stringify(data.bodyImageAnchors ?? [])) {
        taskNodeActions?.updateNodeData(id, { bodyImageAnchors: next.bodyImageAnchors });
      }
      if (!isComposing) {
        const nextSignature = richNodeSemanticSignature(value, next.bodyImageAnchors, data.attachments);
        if (event.currentTarget.dataset.richSemanticSignature !== nextSignature) {
          renderRichNodeEditor(event.currentTarget, value, next.bodyImageAnchors, data.attachments);
          event.currentTarget.focus();
          setRichNodeSelectionOffset(event.currentTarget, selectionOffset);
        }
        syncSkillQuery(value, event.currentTarget);
      }
    },
    [data.body, data.bodyImageAnchors, id, syncSkillQuery]
  );

  const chooseSkill = useCallback((skill: SkillSummary) => {
    if (!skillQuery) return;
    const next = insertSkillToken(bodyDraftRef.current, skillQuery, skill.name);
    const nextAnchors = shiftImageAnchorsForReplacement(
      bodyImageAnchorsDraftRef.current,
      skillQuery.start,
      skillQuery.end,
      next.caret - skillQuery.start
    );
    bodyDraftRef.current = next.value;
    setBodyDraft(next.value);
    bodyImageAnchorsDraftRef.current = nextAnchors;
    setBodyImageAnchorsDraft(nextAnchors);
    taskNodeActions?.updateNodeData(id, { body: next.value, bodyImageAnchors: nextAnchors });
    setSkillQuery(null);
    if (bodyRef.current) renderRichNodeEditor(bodyRef.current, next.value, nextAnchors, data.attachments);
    window.requestAnimationFrame(() => {
      bodyRef.current?.focus();
      if (bodyRef.current) setRichNodeSelectionOffset(bodyRef.current, next.caret);
    });
  }, [data.attachments, id, skillQuery]);

  const handleConnectButtonMouseDown = useCallback(
    (side: ConnectedNodeSide) => (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let dragged = false;

      function removeListeners(): void {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }

      function handleMouseMove(moveEvent: MouseEvent): void {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        if (deltaX * deltaX + deltaY * deltaY > 16) {
          dragged = true;
        }
      }

      function handleMouseUp(upEvent: MouseEvent): void {
        removeListeners();
        suppressConnectButtonClickRef.current = true;
        if (dragged) return;
        upEvent.preventDefault();
        taskNodeActions?.createConnectedNode(id, side);
      }

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [id]
  );

  const handleConnectButtonClick = useCallback(
    (side: ConnectedNodeSide) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (suppressConnectButtonClickRef.current) {
        suppressConnectButtonClickRef.current = false;
        event.preventDefault();
        return;
      }

      taskNodeActions?.createConnectedNode(id, side);
    },
    [id]
  );

  return (
    <div
      ref={rootRef}
      className={`task-node ${selected ? "is-selected" : ""}`}
      onMouseEnter={() => taskNodeActions?.setNodeHover(id, true)}
      onMouseLeave={() => taskNodeActions?.setNodeHover(id, false)}
    >
      <Handle type="target" position={Position.Left} className="node-handle" isConnectableStart={!hasParent} isConnectableEnd={!hasParent}>
        {hasParent ? (
          <span className="node-edge-cap" aria-hidden="true" />
        ) : (
          <button
            className="node-connect-button"
            type="button"
            aria-label={t("task.connectLeft")}
            onMouseDown={handleConnectButtonMouseDown("left")}
            onClick={handleConnectButtonClick("left")}
          >
            <Icon name="plus-lg" size={16} />
          </button>
        )}
      </Handle>
      <div className="task-node-header">
        <input
          ref={titleRef}
          className={`task-title ${editingField === "title" ? "nodrag is-editing" : "is-readonly"}`}
          value={titleDraft}
          placeholder={t("task.titlePlaceholder")}
          readOnly={editingField !== "title"}
          tabIndex={editingField === "title" ? 0 : -1}
          onPointerDown={handleEditablePointerDown}
          onClick={() => {
            if (editingField !== "title") startEditing("title");
          }}
          onFocus={(event) => handleEditableFocus(event, "title")}
          onBlur={(event) => handleEditableBlur(event, "title")}
          onKeyDown={handleEditableKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onChange={handleTitleChange}
        />
        <TooltipAnchor className="nodrag" label={hasBody ? t("task.run") : t("task.runEmpty")} shortcut={shortcuts.runCurrentTask}>
          <IconButton
            className="nodrag"
            filled={false}
            icon="play-1"
            size="lg"
            aria-label={hasBody ? t("task.run") : t("task.runEmpty")}
            disabled={!hasBody}
            onClick={() => taskNodeActions?.runNode(id, "flow")}
          />
        </TooltipAnchor>
        <TooltipAnchor className="nodrag" label={t("task.more")}>
          <RadixDropdownMenu.Root>
            <RadixDropdownMenu.Trigger asChild>
              <IconButton className="nodrag" filled={false} icon="dots-horizontal" size="lg" aria-label={t("task.more")} />
            </RadixDropdownMenu.Trigger>
            <RadixDropdownMenu.Portal>
              <RadixDropdownMenu.Content className="dropdown-content node-action-menu" sideOffset={8} align="end">
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="copy" label={t("task.copy")} onClick={() => taskNodeActions?.duplicateNode(id)} />
                </RadixDropdownMenu.Item>
                <RadixDropdownMenu.Item asChild disabled={!hasBody}>
                  <ActionMenuItem
                    icon="book-bookmark"
                    label={t("task.saveAsTemplate")}
                    disabled={!hasBody}
                    onClick={() => {
                      if (!hasBody) return;
                      const templateData = {
                        ...data,
                        title: titleDraftRef.current,
                        body: bodyDraftRef.current,
                        runMode
                      };
                      flushDraftToStore();
                      void taskNodeActions?.saveNodeAsTemplate(id, templateData);
                    }}
                  />
                </RadixDropdownMenu.Item>
                <RadixDropdownMenu.Item
                  asChild
                  onSelect={() => taskNodeActions?.deleteNode(id)}
                >
                  <ActionMenuItem icon="trash" label={t("task.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
                </RadixDropdownMenu.Item>
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        </TooltipAnchor>
      </div>

      <div className="task-node-card">
        <div className="task-body-editor">
          <RichNodeBody
            ref={bodyRef}
            assetBaseUrl={assetBaseUrl}
            attachments={data.attachments}
            body={bodyDraft}
            bodyImageAnchors={bodyImageAnchorsDraft}
            className={`task-body rich-node-body ${hasBody ? "has-content" : ""} ${editingField === "body" ? "nodrag nowheel is-editing" : "is-readonly"}`}
            editing={editingField === "body"}
            placeholder={t("task.bodyPlaceholder")}
            tabIndex={editingField === "body" ? 0 : -1}
            aria-autocomplete="list"
            aria-activedescendant={skillQuery && visibleSkills[activeSkillIndex] ? `${skillPickerId}-option-${activeSkillIndex}` : undefined}
            aria-controls={skillQuery && visibleSkills.length ? skillPickerId : undefined}
            aria-expanded={editingField === "body" && Boolean(skillQuery)}
            aria-haspopup="listbox"
            onPointerDown={handleEditablePointerDown}
            onPointerUp={(event) => {
              if (editingField !== "body") return;
              syncSkillQuery(bodyDraftRef.current, event.currentTarget);
            }}
            onClick={(event) => {
              const target = event.target instanceof Element ? event.target : null;
              if (target?.closest("a, button")) return;
              if (editingField !== "body") startEditing("body");
            }}
            onFocus={(event) => handleEditableFocus(event, "body")}
            onBlur={(event) => handleEditableBlur(event, "body")}
            onKeyDown={handleEditableKeyDown}
            onKeyUp={(event) => {
              if (editingField !== "body") return;
              syncSkillQuery(bodyDraftRef.current, event.currentTarget);
            }}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onInput={handleBodyInput}
            onPaste={(event) => {
              if (event.clipboardData.files.length) return;
              const text = event.clipboardData.getData("text/plain");
              if (!text) return;
              event.preventDefault();
              document.execCommand("insertText", false, text);
            }}
            onRemoveAttachment={(attachmentId) => taskNodeActions?.removeAttachment(id, attachmentId)}
          />

          {editingField === "body" && skillQuery ? createPortal(
            <div
              ref={skillPickerRef}
              className={`skill-picker nodrag nowheel ${skillPickerPosition ? "is-positioned" : ""}`}
              data-placement={skillPickerPosition?.placement}
              id={skillPickerId}
              role={visibleSkills.length ? "listbox" : "presentation"}
              aria-label={visibleSkills.length ? t("task.skillPickerLabel") : undefined}
              style={{ left: skillPickerPosition?.left ?? 0, top: skillPickerPosition?.top ?? 0 }}
            >
            {skillStatus === "loading" ? <p className="skill-picker-message" role="status" aria-live="polite">{t("task.skillPickerLoading")}</p> : null}
            {skillStatus !== "loading" && visibleSkills.length ? (
              <div className="skill-picker-list">
                {visibleSkills.map((skill, index) => (
                  <div
                    key={skill.name}
                    ref={(option) => {
                      skillOptionRefs.current[index] = option;
                    }}
                    id={`${skillPickerId}-option-${index}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === activeSkillIndex}
                    className={`skill-picker-option ${index === activeSkillIndex ? "is-active" : ""}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveSkillIndex(index)}
                    onClick={() => chooseSkill(skill)}
                  >
                    <span className="skill-picker-option-name">${skill.name}</span>
                    <span className="skill-picker-option-description">{skill.displayName || skill.description}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {skillStatus === "error" ? (
              <div className="skill-picker-message is-error" role="status" aria-live="polite">
                <span>{t("task.skillPickerUnavailable")}</span>
                <button
                  type="button"
                  className="skill-picker-retry"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void loadSkills(true)}
                >
                  {t("task.skillPickerRefresh")}
                </button>
              </div>
            ) : null}
            {skillStatus === "ready" && !visibleSkills.length ? <p className="skill-picker-message">{t("task.skillPickerNoMatch")}</p> : null}
            {skillStatus !== "loading" && !visibleSkills.length ? <p className="skill-picker-hint">{t("task.skillPickerManualHint")}</p> : null}
            </div>,
            document.body
          ) : null}
        </div>

        {fileAttachments.length ? (
          <div className="attachment-grid">
            {fileAttachments.map((attachment) => (
              <TaskAttachmentChip
                key={attachment.id}
                attachment={attachment}
                nodeId={id}
                assetBaseUrl={assetBaseUrl}
              />
            ))}
          </div>
        ) : null}

        <div className="task-node-footer">
          <TooltipAnchor className="nodrag" label={t("task.addAttachment")}>
            <IconButton
              className="nodrag"
              filled={false}
              icon="plus-lg"
              size="lg"
              aria-label={t("task.addAttachment")}
              onClick={() => taskNodeActions?.chooseFilesForNode(id, bodySelectionOffsetRef.current)}
            />
          </TooltipAnchor>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="node-handle">
        {hasChild ? <span className="node-edge-cap" aria-hidden="true" /> : null}
        <button
          className="node-connect-button"
          type="button"
          aria-label={t("task.connectRight")}
          onMouseDown={handleConnectButtonMouseDown("right")}
          onClick={handleConnectButtonClick("right")}
        >
          <Icon name="plus-lg" size={16} />
        </button>
      </Handle>
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
