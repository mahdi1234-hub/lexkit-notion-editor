"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Type,
  CodeSquare,
  Link as LinkIcon,
} from "lucide-react";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useLexKitEditor } from "./extensions";

type LexKitCommands = ReturnType<typeof useLexKitEditor>["commands"];

interface SlashItem {
  key: string;
  title: string;
  subtitle: string;
  aliases: string[];
  icon: React.ReactNode;
  run: (commands: LexKitCommands) => void;
}

const ITEMS: SlashItem[] = [
  {
    key: "paragraph",
    title: "Paragraph",
    subtitle: "Plain text paragraph.",
    aliases: ["p", "text", "paragraph"],
    icon: <Type className="h-5 w-5" />,
    run: (c) => c.toggleParagraph(),
  },
  {
    key: "h1",
    title: "Heading 1",
    subtitle: "Big section heading.",
    aliases: ["h1", "heading", "title"],
    icon: <Heading1 className="h-5 w-5" />,
    run: (c) => c.toggleHeading("h1"),
  },
  {
    key: "h2",
    title: "Heading 2",
    subtitle: "Medium section heading.",
    aliases: ["h2", "heading"],
    icon: <Heading2 className="h-5 w-5" />,
    run: (c) => c.toggleHeading("h2"),
  },
  {
    key: "h3",
    title: "Heading 3",
    subtitle: "Small section heading.",
    aliases: ["h3", "heading"],
    icon: <Heading3 className="h-5 w-5" />,
    run: (c) => c.toggleHeading("h3"),
  },
  {
    key: "ul",
    title: "Bullet list",
    subtitle: "Unordered list.",
    aliases: ["bullet", "ul", "list"],
    icon: <List className="h-5 w-5" />,
    run: (c) => c.toggleUnorderedList(),
  },
  {
    key: "ol",
    title: "Numbered list",
    subtitle: "Ordered list.",
    aliases: ["numbered", "ol", "list", "ordered"],
    icon: <ListOrdered className="h-5 w-5" />,
    run: (c) => c.toggleOrderedList(),
  },
  {
    key: "quote",
    title: "Quote",
    subtitle: "Block quotation.",
    aliases: ["quote", "blockquote"],
    icon: <Quote className="h-5 w-5" />,
    run: (c) => c.toggleQuote(),
  },
  {
    key: "code",
    title: "Code block",
    subtitle: "Monospace code block.",
    aliases: ["code", "pre"],
    icon: <Code2 className="h-5 w-5" />,
    run: (c) => c.toggleCodeBlock(),
  },
  {
    key: "hr",
    title: "Divider",
    subtitle: "Horizontal rule.",
    aliases: ["hr", "divider", "rule", "---"],
    icon: <Minus className="h-5 w-5" />,
    run: (c) => c.insertHorizontalRule(),
  },
  {
    key: "table",
    title: "Table",
    subtitle: "3x3 table.",
    aliases: ["table"],
    icon: <TableIcon className="h-5 w-5" />,
    run: (c) =>
      c.insertTable({ rows: 3, columns: 3, includeHeaders: true }),
  },
  {
    key: "image",
    title: "Image",
    subtitle: "Insert an image by URL.",
    aliases: ["image", "img", "picture"],
    icon: <ImageIcon className="h-5 w-5" />,
    run: (c) => {
      const src = typeof window !== "undefined" ? window.prompt("Image URL") : null;
      if (src) c.insertImage({ src, alt: "" });
    },
  },
  {
    key: "link",
    title: "Link",
    subtitle: "Insert a hyperlink.",
    aliases: ["link", "url", "href"],
    icon: <LinkIcon className="h-5 w-5" />,
    run: (c) => {
      const url = typeof window !== "undefined" ? window.prompt("Link URL") : null;
      if (url) c.insertLink(url);
    },
  },
  {
    key: "html",
    title: "HTML embed",
    subtitle: "Raw HTML block.",
    aliases: ["html", "embed", "iframe"],
    icon: <CodeSquare className="h-5 w-5" />,
    run: (c) => c.insertHTMLEmbed("<div></div>"),
  },
];

function filterItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ITEMS;
  return ITEMS.filter(
    (it) =>
      it.title.toLowerCase().includes(q) ||
      it.aliases.some((a) => a.startsWith(q) || a.includes(q))
  );
}

export function SlashMenu() {
  const { editor, commands } = useLexKitEditor();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<{ anchorOffset: number; key: string } | null>(null);

  const results = useMemo(() => filterItems(query), [query]);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
    setIndex(0);
    triggerRef.current = null;
  };

  const removeSlashAndRun = (item: SlashItem) => {
    if (!editor) return;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchor = selection.anchor;
      const node = anchor.getNode();
      if (node.getType() === "text") {
        const text = node.getTextContent();
        const lastSlash = text.lastIndexOf("/");
        if (lastSlash >= 0) {
          // Remove "/" + query text from the node
          const before = text.slice(0, lastSlash);
          (node as unknown as { setTextContent: (t: string) => void }).setTextContent(
            before
          );
          selection.anchor.set(node.getKey(), before.length, "text");
          selection.focus.set(node.getKey(), before.length, "text");
        }
      }
    });
    // small delay so the DOM updates before inserting block
    requestAnimationFrame(() => {
      item.run(commands);
      closeMenu();
    });
  };

  // Listen for '/' keypress to open the menu, and track typing while open
  useEffect(() => {
    if (!editor) return;
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const computeCoords = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const range = sel.getRangeAt(0).cloneRange();
      const rects = range.getClientRects();
      const rect = rects.length
        ? rects[rects.length - 1]
        : (range.getBoundingClientRect() as DOMRect);
      if (!rect || (rect.top === 0 && rect.left === 0 && rect.width === 0)) {
        const anchorRect = rootEl.getBoundingClientRect();
        return { top: anchorRect.top + 24, left: anchorRect.left + 8 };
      }
      return { top: rect.bottom + 6, left: rect.left };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) {
        if (e.key === "/") {
          // open on next tick so the '/' is inserted first
          setTimeout(() => {
            const c = computeCoords();
            if (c) setCoords(c);
            setOpen(true);
            setQuery("");
            setIndex(0);
          }, 0);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => (i + 1) % Math.max(results.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = results[index];
        if (it) removeSlashAndRun(it);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      } else if (e.key === "Backspace") {
        if (query.length === 0) {
          // user deleted the '/' → close
          setTimeout(() => {
            setOpen(false);
          }, 0);
        } else {
          setQuery((q) => q.slice(0, -1));
          setIndex(0);
        }
      } else if (e.key.length === 1) {
        setQuery((q) => q + e.key);
        setIndex(0);
      }
    };

    rootEl.addEventListener("keydown", onKeyDown);
    return () => {
      rootEl.removeEventListener("keydown", onKeyDown);
    };
  }, [editor, open, results, index, query, commands]);

  // Also register Lexical commands so arrow keys don't move caret while open
  useEffect(() => {
    if (!editor || !open) return;
    const disposers = [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => true,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => true,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        () => true,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          closeMenu();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
    ];
    return () => disposers.forEach((d) => d());
  }, [editor, open]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      role="listbox"
      className="bn-slash-menu fixed z-50 w-72 rounded-xl border border-border bg-popover p-1 shadow-xl backdrop-blur"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="px-2 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {query ? `/${query}` : "Basic blocks"}
      </div>
      <ul className="max-h-80 overflow-auto">
        {results.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            No matches
          </li>
        )}
        {results.map((it, i) => (
          <li key={it.key}>
            <button
              type="button"
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => {
                // prevent editor blur
                e.preventDefault();
                removeSlashAndRun(it);
              }}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                i === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              }`}
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-border bg-background">
                {it.icon}
              </div>
              <div className="min-w-0">
                <div className="font-medium leading-tight">{it.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {it.subtitle}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}
