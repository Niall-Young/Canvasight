import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from "@xyflow/react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { Editor } from "@tiptap/core";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Strike from "@tiptap/extension-strike";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Text from "@tiptap/extension-text";
import { Dropcursor, Gapcursor, UndoRedo } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Attachment, RunMode, ScatterNodeData, ScatterTaskNodeData } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { getCanvasightAssetBaseUrl, loadCanvasightImageAsset, subscribeCanvasightRuntimeData } from "../lib/canvasightApi";
import type { SkillSummary } from "../lib/canvasightApi";
import {
  InlineCode,
  insertUnmarkedSpaceAfterInlineCode,
  rawMarkdownExtensions,
  SafeLink
} from "../lib/richTextExtensions";
import { placeSkillPicker, type SkillPickerPosition } from "../lib/skillPickerPlacement";
import { shortcuts } from "../lib/shortcuts";
import { filterSkills, findSkillQuery, type SkillQueryRange } from "../lib/skills";
import { formatBytes } from "../lib/utils";
import { useScatterStore } from "../store/scatterStore";
import { ActionMenuItem } from "./ui/action-menu-item";
import { IconButton } from "./ui/icon-button";
import { Icon } from "./ui/icon";
import { TooltipAnchor } from "./ui/tooltip";
import { UploadChip } from "./ui/upload-chip";

type TaskNodeProps = NodeProps<Node<ScatterTaskNodeData, "task">>;
type EditableField = "title" | "body";
type ConnectedNodeSide = "left" | "right";
type EditorSkillQuery = SkillQueryRange & { from: number; to: number };

export interface RuntimeActions {
  updateNodeData: (nodeId: string, patch: Partial<ScatterNodeData>) => void;
  beginNodeEdit: () => void;
  commitNodeEdit: () => void;
  chooseFilesForNode: (nodeId: string) => Promise<void>;
  addFilesToNode: (nodeId: string, files: FileList | File[], source: "upload" | "drop" | "paste") => Promise<void>;
  removeAttachment: (nodeId: string, attachmentId: string) => void;
  promoteAttachment: (nodeId: string, attachmentId: string) => void;
  replaceAsset: (nodeId: string) => void;
  createConnectedNode: (nodeId: string, side: ConnectedNodeSide) => void;
  duplicateNode: (nodeId: string) => void;
  saveNodeAsTemplate: (nodeId: string, data: ScatterNodeData) => Promise<void>;
  deleteNode: (nodeId: string) => void;
  setNodeHover: (nodeId: string, hovered: boolean) => void;
  runNode: (nodeId: string, mode: RunMode) => Promise<void>;
  toggleGroup: (groupId: string) => void;
  ungroupNode: (nodeId: string) => void;
  fitGroup: (groupId: string) => void;
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
      onPromote={() => taskNodeActions?.promoteAttachment(nodeId, attachment.id)}
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
  const bodyPointerPositionRef = useRef<{ left: number; top: number } | null>(null);
  const suppressConnectButtonClickRef = useRef(false);
  const isComposingRef = useRef(false);
  const pendingFinishAfterCompositionRef = useRef(false);
  const bodyEditorRef = useRef<Editor | null>(null);
  const resizeFrameRef = useRef(0);
  // Keep IME edits local until composition ends so store/autosave updates do not commit raw pinyin.
  const titleDraftRef = useRef(data.title);
  const bodyDraftRef = useRef(data.body);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [titleDraft, setTitleDraft] = useState(data.title);
  const [bodyDraft, setBodyDraft] = useState(data.body);
  const [skillQuery, setSkillQuery] = useState<EditorSkillQuery | null>(null);
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

  const syncSkillQuery = useCallback((editor: Editor) => {
    if (isComposingRef.current) {
      setSkillQuery(null);
      return;
    }
    const { $from, empty } = editor.state.selection;
    if (!empty || !$from.parent.isTextblock) {
      setSkillQuery(null);
      return;
    }
    const nextQuery = findSkillQuery($from.parent.textContent, $from.parentOffset, $from.parentOffset);
    const nextEditorQuery = nextQuery
      ? {
          ...nextQuery,
          from: $from.start() + nextQuery.start,
          to: $from.start() + nextQuery.end
        }
      : null;
    setSkillQuery(nextEditorQuery);
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
      const bodyEditor = bodyEditorRef.current;
      const picker = skillPickerRef.current;
      if (!bodyEditor || !picker || !bodyEditor.state.selection.empty) return;
      const caretRect = bodyEditor.view.coordsAtPos(bodyEditor.state.selection.from);
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
    const body = bodyRef.current;
    if (!body) return;
    const observer = new ResizeObserver(() => {
      if (resizeFrameRef.current) return;
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        resizeFrameRef.current = 0;
        updateNodeInternals(id);
      });
    });
    observer.observe(body);
    return () => {
      observer.disconnect();
      if (resizeFrameRef.current) window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = 0;
    };
  }, [id, updateNodeInternals]);

  useEffect(() => {
    if (editingField === "title") return;
    titleDraftRef.current = data.title;
    setTitleDraft(data.title);
  }, [data.title, editingField]);

  const editorKeyDownRef = useRef<(editor: Editor, event: KeyboardEvent) => boolean>(() => false);
  const bodyEditor = useEditor(
    {
      content: data.body,
      contentType: "markdown",
      editable: false,
      injectCSS: false,
      extensions: [
        Blockquote,
        Bold,
        BulletList,
        InlineCode,
        CodeBlock,
        Document,
        Dropcursor,
        Gapcursor,
        HardBreak,
        Heading.configure({ levels: [1, 2, 3] }),
        Italic,
        SafeLink.configure({
          autolink: true,
          linkOnPaste: true,
          openOnClick: false,
          protocols: ["http", "https", "mailto"]
        }),
        ListItem,
        OrderedList,
        Paragraph,
        Placeholder.configure({ placeholder: t("task.bodyPlaceholder") }),
        Strike,
        TaskList,
        TaskItem.configure({ nested: true }),
        Text,
        UndoRedo,
        ...rawMarkdownExtensions,
        Markdown
      ],
      editorProps: {
        attributes: {
          "aria-label": t("task.bodyPlaceholder"),
          class: "task-body-content"
        },
        handleDOMEvents: {
          click: (_view, event) => {
            const target = event.target;
            if (!(target instanceof Element) || !target.closest("a")) return false;
            event.preventDefault();
            return true;
          },
          compositionstart: () => {
            isComposingRef.current = true;
            pendingFinishAfterCompositionRef.current = false;
            setSkillQuery(null);
            return false;
          },
          compositionend: () => {
            isComposingRef.current = false;
            window.setTimeout(() => {
              const currentEditor = bodyEditorRef.current;
              if (!currentEditor) return;
              const markdown = currentEditor.isEmpty ? "" : currentEditor.getMarkdown();
              if (markdown !== bodyDraftRef.current) {
                bodyDraftRef.current = markdown;
                setBodyDraft(markdown);
                taskNodeActions?.updateNodeData(id, { body: markdown });
              }
              syncSkillQuery(currentEditor);
              if (pendingFinishAfterCompositionRef.current && !currentEditor.isFocused) {
                pendingFinishAfterCompositionRef.current = false;
                taskNodeActions?.commitNodeEdit();
                setEditingField(null);
              }
            }, 0);
            return false;
          },
          keydown: (_view, event) => {
            const currentEditor = bodyEditorRef.current;
            return currentEditor ? editorKeyDownRef.current(currentEditor, event) : false;
          },
          paste: (_view, event) => {
            if (event.clipboardData && [...event.clipboardData.files].length > 0) {
              event.preventDefault();
              return true;
            }
            return false;
          }
        },
        transformPastedHTML: (html) => {
          const documentFragment = new DOMParser().parseFromString(html, "text/html");
          documentFragment.querySelectorAll("script,style,img,video,audio,iframe,object,embed").forEach((element) => element.remove());
          documentFragment.querySelectorAll("*").forEach((element) => {
            for (const attribute of [...element.attributes]) {
              if (attribute.name.startsWith("on") || attribute.name === "style") element.removeAttribute(attribute.name);
            }
          });
          return documentFragment.body.innerHTML;
        }
      },
      onSelectionUpdate: ({ editor }) => {
        syncSkillQuery(editor);
      },
      onUpdate: ({ editor }) => {
        if (isComposingRef.current || editor.view.composing) return;
        const markdown = editor.isEmpty ? "" : editor.getMarkdown();
        if (markdown === bodyDraftRef.current) return;
        bodyDraftRef.current = markdown;
        setBodyDraft(markdown);
        taskNodeActions?.updateNodeData(id, { body: markdown });
        syncSkillQuery(editor);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!bodyEditor) return;
    bodyEditorRef.current = bodyEditor;
    return () => {
      if (bodyEditorRef.current === bodyEditor) bodyEditorRef.current = null;
    };
  }, [bodyEditor]);

  useEffect(() => {
    if (editingField === "body") return;
    bodyDraftRef.current = data.body;
    setBodyDraft(data.body);
    if (bodyEditor && (bodyEditor.isEmpty ? "" : bodyEditor.getMarkdown()) !== data.body) {
      bodyEditor.commands.setContent(data.body, { contentType: "markdown", emitUpdate: false });
    }
  }, [bodyEditor, data.body, editingField]);

  useEffect(() => {
    if (!bodyEditor) return;
    bodyEditor.setEditable(editingField === "body", false);
  }, [bodyEditor, editingField]);

  const isNodeEditableElement = useCallback(
    (target: EventTarget | null) =>
      target === titleRef.current || (target instanceof globalThis.Node && Boolean(bodyRef.current?.contains(target))),
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
      const pointer = bodyPointerPositionRef.current;
      bodyPointerPositionRef.current = null;
      const position = pointer ? bodyEditor?.view.posAtCoords(pointer) : null;
      if (position) {
        bodyEditor?.chain().focus().setTextSelection(position.pos).run();
      } else {
        bodyEditor?.commands.focus("end");
      }
    }
  }, [bodyEditor, editingField]);

  const handleEditablePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    pointerStartedSelectedRef.current = selected;
    if (event.button === 0 && event.currentTarget === bodyRef.current && selected) {
      bodyPointerPositionRef.current = { left: event.clientX, top: event.clientY };
    }
  }, [selected]);

  const startEditing = useCallback(
    (field: EditableField) => {
      if (!pointerStartedSelectedRef.current) return;
      taskNodeActions?.beginNodeEdit();
      setEditingField(field);
    },
    []
  );

  const handleEditableFocus = useCallback((event: React.FocusEvent<HTMLElement>, field: EditableField) => {
    if (editingField !== field) {
      event.currentTarget.blur();
    }
  }, [editingField]);

  const handleEditableBlur = useCallback(
    (event: React.FocusEvent<HTMLElement>, field: EditableField) => {
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

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement>) => {
    const field = "title";
    const value = event.currentTarget.value;
    titleDraftRef.current = value;
    setTitleDraft(value);

    isComposingRef.current = false;
    flushDraftToStore(field);
    if (!pendingFinishAfterCompositionRef.current) return;
    window.setTimeout(() => {
      if (!isNodeEditableFocused()) {
        finishEditing();
        return;
      }
      pendingFinishAfterCompositionRef.current = false;
    }, 0);
  }, [finishEditing, flushDraftToStore, isNodeEditableFocused]);

  const isChangeDuringComposition = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      isComposingRef.current || Boolean((event.nativeEvent as InputEvent).isComposing),
    []
  );

  const handleEditableKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
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

  const chooseSkill = useCallback((skill: SkillSummary) => {
    const editor = bodyEditorRef.current;
    if (!skillQuery || !editor) return;
    const token = `$${skill.name} `;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: skillQuery.from, to: skillQuery.to }, { type: "text", text: token })
      .setTextSelection(skillQuery.from + token.length)
      .run();
    setSkillQuery(null);
  }, [skillQuery]);

  editorKeyDownRef.current = (editor, event) => {
    if (isComposingRef.current || event.isComposing || event.keyCode === 229) return false;
    if ((event.key === " " || event.key === "Spacebar") && insertUnmarkedSpaceAfterInlineCode(editor)) {
      event.preventDefault();
      return true;
    }
    if (skillQuery) {
      if (event.key === "ArrowDown" && visibleSkills.length) {
        event.preventDefault();
        setActiveSkillIndex((current) => Math.min(visibleSkills.length - 1, current + 1));
        return true;
      }
      if (event.key === "ArrowUp" && visibleSkills.length) {
        event.preventDefault();
        setActiveSkillIndex((current) => Math.max(0, current - 1));
        return true;
      }
      if ((event.key === "PageDown" || event.key === "PageUp") && visibleSkills.length) {
        event.preventDefault();
        const direction = event.key === "PageDown" ? 1 : -1;
        setActiveSkillIndex((current) => Math.max(0, Math.min(visibleSkills.length - 1, current + direction * 4)));
        return true;
      }
      if ((event.key === "Enter" || event.key === "Tab") && visibleSkills[activeSkillIndex]) {
        event.preventDefault();
        chooseSkill(visibleSkills[activeSkillIndex]);
        return true;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSkillQuery(null);
        return true;
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      editor.commands.blur();
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!bodyEditor) return;
    const editorElement = bodyEditor.view.dom;
    editorElement.setAttribute("role", "combobox");
    editorElement.setAttribute("aria-autocomplete", "list");
    editorElement.setAttribute("aria-haspopup", "listbox");
    editorElement.setAttribute("aria-expanded", editingField === "body" && Boolean(skillQuery) ? "true" : "false");
    if (skillQuery && visibleSkills[activeSkillIndex]) {
      editorElement.setAttribute("aria-controls", skillPickerId);
      editorElement.setAttribute("aria-activedescendant", `${skillPickerId}-option-${activeSkillIndex}`);
    } else {
      editorElement.removeAttribute("aria-controls");
      editorElement.removeAttribute("aria-activedescendant");
    }
  }, [activeSkillIndex, bodyEditor, editingField, skillPickerId, skillQuery, visibleSkills]);

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
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
        isConnectable={!hasParent}
        isConnectableStart={!hasParent}
        isConnectableEnd={!hasParent}
      >
        {hasParent ? <span className="node-edge-cap" aria-hidden="true" /> : null}
        {!hasParent ? (
          <button
            className="node-connect-button"
            type="button"
            aria-label={t("task.connectLeft")}
            onMouseDown={handleConnectButtonMouseDown("left")}
            onClick={handleConnectButtonClick("left")}
          >
            <Icon name="plus-lg" size={16} />
          </button>
        ) : null}
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
        <div
          ref={bodyRef}
          className={`task-body-editor task-body ${hasBody ? "has-content" : ""} ${editingField === "body" ? "nodrag nowheel is-editing" : "is-readonly"}`}
          onPointerDown={handleEditablePointerDown}
          onClick={() => {
            if (editingField !== "body") startEditing("body");
          }}
          onFocus={(event) => handleEditableFocus(event, "body")}
          onBlur={(event) => handleEditableBlur(event, "body")}
          onWheelCapture={(event) => {
            if (event.target instanceof Element && event.target.closest("pre")) event.stopPropagation();
          }}
        >
          <EditorContent editor={bodyEditor} />

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

        {data.attachments.length ? (
          <div className="attachment-grid">
            {data.attachments.map((attachment) => (
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
            <IconButton className="nodrag" filled={false} icon="plus-lg" size="lg" aria-label={t("task.addAttachment")} onClick={() => taskNodeActions?.chooseFilesForNode(id)} />
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
