import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { RunMode, ScatterNodeData } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { shortcuts } from "../lib/shortcuts";
import { formatBytes } from "../lib/utils";
import { useScatterStore } from "../store/scatterStore";
import { ActionMenuItem } from "./ui/action-menu-item";
import { IconButton } from "./ui/icon-button";
import { Icon } from "./ui/icon";
import { Switch } from "./ui/switch";
import { TooltipAnchor } from "./ui/tooltip";
import { UploadChip } from "./ui/upload-chip";

type TaskNodeProps = NodeProps<Node<ScatterNodeData, "task">>;
type EditableField = "title" | "body";
type ConnectedNodeSide = "left" | "right";

function fitTextareaHeight(textarea: HTMLTextAreaElement | null): boolean {
  if (!textarea) return false;
  const previousHeight = textarea.style.height;
  textarea.style.height = "auto";
  const nextHeight = `${textarea.scrollHeight}px`;
  textarea.style.height = nextHeight;
  return previousHeight !== nextHeight;
}

interface RuntimeActions {
  updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => void;
  beginNodeEdit: () => void;
  commitNodeEdit: () => void;
  chooseFilesForNode: (nodeId: string) => Promise<void>;
  addFilesToNode: (nodeId: string, files: FileList | File[], source: "upload" | "drop" | "paste") => Promise<void>;
  removeAttachment: (nodeId: string, attachmentId: string) => void;
  createConnectedNode: (nodeId: string, side: ConnectedNodeSide) => void;
  duplicateNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  setNodeHover: (nodeId: string, hovered: boolean) => void;
  runNode: (nodeId: string, mode: RunMode) => Promise<void>;
}

export let taskNodeActions: RuntimeActions | null = null;

export function setTaskNodeActions(actions: RuntimeActions): void {
  taskNodeActions = actions;
}

function TaskNodeComponent({ id, data, selected }: TaskNodeProps): ReactElement {
  const { t } = useI18n();
  const updateNodeInternals = useUpdateNodeInternals();
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pointerStartedSelectedRef = useRef(false);
  const suppressConnectButtonClickRef = useRef(false);
  const isComposingRef = useRef(false);
  const pendingFinishAfterCompositionRef = useRef(false);
  const pendingNodeInternalsUpdateRef = useRef(false);
  // Keep IME edits local until composition ends so store/autosave updates do not commit raw pinyin.
  const titleDraftRef = useRef(data.title);
  const bodyDraftRef = useRef(data.body);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [titleDraft, setTitleDraft] = useState(data.title);
  const [bodyDraft, setBodyDraft] = useState(data.body);

  const runMode = data.runMode || "flow";
  const hasBody = bodyDraft.trim().length > 0;
  const hasParent = useScatterStore((state) =>
    state.edges.some((edge) => edge.target === id && state.nodes.some((node) => node.id === edge.source))
  );
  const hasChild = useScatterStore((state) =>
    state.edges.some((edge) => edge.source === id && state.nodes.some((node) => node.id === edge.target))
  );

  const fitBodyTextarea = useCallback((deferNodeInternalsUpdate = false) => {
    if (fitTextareaHeight(bodyRef.current)) {
      if (deferNodeInternalsUpdate) {
        pendingNodeInternalsUpdateRef.current = true;
        return;
      }
      updateNodeInternals(id);
    }
  }, [id, updateNodeInternals]);

  useLayoutEffect(() => {
    fitBodyTextarea(isComposingRef.current);
  }, [bodyDraft, fitBodyTextarea]);

  useEffect(() => {
    if (editingField === "title") return;
    titleDraftRef.current = data.title;
    setTitleDraft(data.title);
  }, [data.title, editingField]);

  useEffect(() => {
    if (editingField === "body") return;
    bodyDraftRef.current = data.body;
    setBodyDraft(data.body);
  }, [data.body, editingField]);

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

      if (Object.keys(patch).length > 0) {
        taskNodeActions?.updateNodeData(id, patch);
      }
    },
    [data.body, data.title, id]
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
      const valueLength = bodyRef.current?.value.length ?? 0;
      bodyRef.current?.setSelectionRange(valueLength, valueLength);
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

  const handleEditableFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: EditableField) => {
    if (editingField !== field) {
      event.currentTarget.blur();
    }
  }, [editingField]);

  const handleEditableBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: EditableField) => {
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
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.currentTarget === titleRef.current ? "title" : "body";
    const value = event.currentTarget.value;

    if (field === "title") {
      titleDraftRef.current = value;
      setTitleDraft(value);
    } else {
      bodyDraftRef.current = value;
      setBodyDraft(value);
      if (fitTextareaHeight(event.currentTarget as HTMLTextAreaElement)) {
        pendingNodeInternalsUpdateRef.current = true;
      }
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
  }, [finishEditing, flushDraftToStore, id, isNodeEditableFocused, updateNodeInternals]);

  const isChangeDuringComposition = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      isComposingRef.current || Boolean((event.nativeEvent as InputEvent).isComposing),
    []
  );

  const handleEditableKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }, []);

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

  const handleBodyChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      const isComposing = isChangeDuringComposition(event);
      bodyDraftRef.current = value;
      setBodyDraft(value);

      if (fitTextareaHeight(event.currentTarget)) {
        if (isComposing) {
          pendingNodeInternalsUpdateRef.current = true;
        } else {
          updateNodeInternals(id);
        }
      }

      if (!isComposing && value !== data.body) {
        taskNodeActions?.updateNodeData(id, { body: value });
      }
    },
    [data.body, id, isChangeDuringComposition, updateNodeInternals]
  );

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
            onClick={() => taskNodeActions?.runNode(id, runMode)}
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
                  <ActionMenuItem icon="play" label={t("task.runNodeOnly")} onClick={() => taskNodeActions?.runNode(id, "node")} />
                </RadixDropdownMenu.Item>
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="copy" label={t("task.copy")} onClick={() => taskNodeActions?.duplicateNode(id)} />
                </RadixDropdownMenu.Item>
                <RadixDropdownMenu.Item asChild>
                  <ActionMenuItem icon="trash" label={t("task.delete")} onClick={() => taskNodeActions?.deleteNode(id)} />
                </RadixDropdownMenu.Item>
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        </TooltipAnchor>
      </div>

      <div className="task-node-card">
        <textarea
          ref={bodyRef}
          className={`task-body ${hasBody ? "has-content" : ""} ${editingField === "body" ? "nodrag nowheel is-editing" : "is-readonly"}`}
          value={bodyDraft}
          placeholder={t("task.bodyPlaceholder")}
          readOnly={editingField !== "body"}
          tabIndex={editingField === "body" ? 0 : -1}
          onPointerDown={handleEditablePointerDown}
          onClick={() => {
            if (editingField !== "body") startEditing("body");
          }}
          onFocus={(event) => handleEditableFocus(event, "body")}
          onBlur={(event) => handleEditableBlur(event, "body")}
          onKeyDown={handleEditableKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onChange={handleBodyChange}
        />

        {data.attachments.length ? (
          <div className="attachment-grid">
            {data.attachments.map((attachment) => (
              <UploadChip
                key={attachment.id}
                className="nodrag"
                fileName={attachment.originalName}
                imageAlt={attachment.originalName}
                imageSrc={attachment.kind === "image" ? attachment.fileUrl : undefined}
                kind={attachment.kind}
                title={`${attachment.storedPath} · ${formatBytes(attachment.size)}`}
                onDoubleClick={() => window.scatter.showInFolder(attachment.storedPath)}
                onRemove={() => {
                  taskNodeActions?.removeAttachment(id, attachment.id);
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="task-node-footer">
          <TooltipAnchor className="nodrag" label={t("task.addAttachment")}>
            <IconButton className="nodrag" filled={false} icon="plus-lg" size="lg" aria-label={t("task.addAttachment")} onClick={() => taskNodeActions?.chooseFilesForNode(id)} />
          </TooltipAnchor>
          <div className="task-node-settings">
            <Switch
              checked={data.planMode}
              label={t("task.planMode")}
              onCheckedChange={(checked) => taskNodeActions?.updateNodeData(id, { planMode: checked })}
            />
          </div>
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
