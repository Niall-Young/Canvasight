import { mergeAttributes, Node, type Editor, type MarkdownToken } from "@tiptap/core";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";

export const InlineCode = Code.extend({
  keepOnSplit: false
});

export function insertUnmarkedSpaceAfterInlineCode(editor: Editor): boolean {
  const { empty, $from } = editor.state.selection;
  const code = editor.schema.marks.code;
  if (!empty || !code) return false;

  const before = $from.nodeBefore;
  const after = $from.nodeAfter;
  if (!before?.isText || !code.isInSet(before.marks)) return false;
  if (after?.isText && code.isInSet(after.marks)) return false;

  const position = $from.pos;
  return editor.commands.command(({ tr }) => {
    tr.insertText(" ", position);
    tr.removeMark(position, position + 1, code);
    tr.removeStoredMark(code);
    return true;
  });
}

export function isSafeLinkHref(href: string): boolean {
  const value = href.trim();
  if (!value || /[\u0000-\u001F\u007F]/u.test(value)) return false;
  const scheme = value.match(/^([A-Za-z][A-Za-z0-9+.-]*):/);
  return !scheme || ["http", "https", "mailto"].includes(scheme[1].toLocaleLowerCase());
}

export const SafeLink = Link.extend({
  parseMarkdown(token, helpers) {
    const href = String(token.href ?? "");
    const content = helpers.parseInline(token.tokens ?? []);
    if (!isSafeLinkHref(href)) return content;
    return {
      mark: "link",
      attrs: {
        href,
        title: token.title ?? null
      },
      content
    };
  }
});

function rawBlockNode(name: string, markdownTokenName: string): Node {
  return Node.create({
    name,
    group: "block",
    atom: true,
    selectable: true,
    addAttributes() {
      return {
        raw: { default: "" }
      };
    },
    parseHTML() {
      return [{ tag: `pre[data-raw-markdown="${name}"]` }];
    },
    renderHTML({ HTMLAttributes, node }) {
      return [
        "pre",
        mergeAttributes(HTMLAttributes, {
          class: "task-body-raw-markdown",
          "data-raw-markdown": name
        }),
        ["code", {}, String(node.attrs.raw)]
      ];
    },
    markdownTokenName,
    parseMarkdown(token: MarkdownToken) {
      return { type: name, attrs: { raw: token.raw ?? token.text ?? "" } };
    },
    renderMarkdown(node) {
      return String(node.attrs?.raw ?? "");
    }
  });
}

export const RawMarkdownTable = rawBlockNode("rawMarkdownTable", "table");
export const RawMarkdownHtml = rawBlockNode("rawMarkdownHtml", "html");

export const RawMarkdownHeading = Node.create({
  ...rawBlockNode("rawMarkdownHeading", "rawMarkdownHeading").config,
  markdownTokenizer: {
    name: "rawMarkdownHeading",
    level: "block",
    start: (source) => source.search(/^#{4,6}(?:[ \t]+|$)/m),
    tokenize(source) {
      const match = source.match(/^(#{4,6})(?:[ \t]+)([^\n]*)(?:\n|$)/);
      if (!match) return undefined;
      return { type: "rawMarkdownHeading", raw: match[0], text: match[2] };
    }
  }
});

export const RawMarkdownHorizontalRule = Node.create({
  ...rawBlockNode("rawMarkdownHorizontalRule", "rawMarkdownHorizontalRule").config,
  markdownTokenizer: {
    name: "rawMarkdownHorizontalRule",
    level: "block",
    start: (source) => source.search(/^(?: {0,3})(?:\*[\t ]*){3,}$|^(?: {0,3})(?:-[\t ]*){3,}$|^(?: {0,3})(?:_[\t ]*){3,}$/m),
    tokenize(source) {
      const match = source.match(/^(?: {0,3})((?:\*[\t ]*){3,}|(?:-[\t ]*){3,}|(?:_[\t ]*){3,})(?:\n|$)/);
      if (!match) return undefined;
      return { type: "rawMarkdownHorizontalRule", raw: match[0] };
    }
  }
});

export const RawMarkdownImage = Node.create({
  name: "rawMarkdownImage",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      raw: { default: "" }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-raw-markdown="image"]' }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "task-body-raw-markdown is-inline",
        "data-raw-markdown": "image"
      }),
      String(node.attrs.raw)
    ];
  },
  markdownTokenName: "image",
  parseMarkdown(token) {
    return { type: "rawMarkdownImage", attrs: { raw: token.raw ?? token.text ?? "" } };
  },
  renderMarkdown(node) {
    return String(node.attrs?.raw ?? "");
  }
});

export const RawMarkdownInlineHtml = Node.create({
  name: "rawMarkdownInlineHtml",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      raw: { default: "" }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-raw-markdown="inline-html"]' }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "task-body-raw-markdown is-inline",
        "data-raw-markdown": "inline-html"
      }),
      String(node.attrs.raw)
    ];
  },
  markdownTokenName: "rawMarkdownInlineHtml",
  markdownTokenizer: {
    name: "rawMarkdownInlineHtml",
    level: "inline",
    start: "<",
    tokenize(source) {
      const match = source.match(/^(?:<!--[\s\S]*?-->|<\/?[A-Za-z][^>\n]*>)/);
      if (!match) return undefined;
      return { type: "rawMarkdownInlineHtml", raw: match[0], text: match[0] };
    }
  },
  parseMarkdown(token) {
    return { type: "rawMarkdownInlineHtml", attrs: { raw: token.raw ?? token.text ?? "" } };
  },
  renderMarkdown(node) {
    return String(node.attrs?.raw ?? "");
  }
});

export const rawMarkdownExtensions = [
  RawMarkdownHeading,
  RawMarkdownHorizontalRule,
  RawMarkdownHtml,
  RawMarkdownImage,
  RawMarkdownInlineHtml,
  RawMarkdownTable
];
