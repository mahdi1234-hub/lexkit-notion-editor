"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
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
import { TextNode } from "lexical";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useLexKitEditor } from "./extensions";

type LexKitCommands = ReturnType<typeof useLexKitEditor>["commands"];

class SlashOption extends MenuOption {
  title: string;
  subtitle: string;
  iconEl: React.ReactNode;
  keywords: string[];
  run: (commands: LexKitCommands) => void;

  constructor(
    key: string,
    args: {
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      keywords: string[];
      run: (commands: LexKitCommands) => void;
    }
  ) {
    super(key);
    this.title = args.title;
    this.subtitle = args.subtitle;
    this.iconEl = args.icon;
    this.keywords = args.keywords;
    this.run = args.run;
  }
}

function buildOptions(): SlashOption[] {
  return [
    new SlashOption("paragraph", {
      title: "Paragraph",
      subtitle: "Plain text.",
      icon: <Type className="h-5 w-5" />,
      keywords: ["p", "text", "paragraph", "plain"],
      run: (c) => c.toggleParagraph(),
    }),
    new SlashOption("h1", {
      title: "Heading 1",
      subtitle: "Big section heading.",
      icon: <Heading1 className="h-5 w-5" />,
      keywords: ["h1", "heading", "title", "big"],
      run: (c) => c.toggleHeading("h1"),
    }),
    new SlashOption("h2", {
      title: "Heading 2",
      subtitle: "Medium section heading.",
      icon: <Heading2 className="h-5 w-5" />,
      keywords: ["h2", "heading", "subtitle"],
      run: (c) => c.toggleHeading("h2"),
    }),
    new SlashOption("h3", {
      title: "Heading 3",
      subtitle: "Small section heading.",
      icon: <Heading3 className="h-5 w-5" />,
      keywords: ["h3", "heading", "small"],
      run: (c) => c.toggleHeading("h3"),
    }),
    new SlashOption("ul", {
      title: "Bullet list",
      subtitle: "Unordered list.",
      icon: <List className="h-5 w-5" />,
      keywords: ["bullet", "ul", "list", "unordered"],
      run: (c) => c.toggleUnorderedList(),
    }),
    new SlashOption("ol", {
      title: "Numbered list",
      subtitle: "Ordered list.",
      icon: <ListOrdered className="h-5 w-5" />,
      keywords: ["numbered", "ol", "list", "ordered"],
      run: (c) => c.toggleOrderedList(),
    }),
    new SlashOption("quote", {
      title: "Quote",
      subtitle: "Block quotation.",
      icon: <Quote className="h-5 w-5" />,
      keywords: ["quote", "blockquote"],
      run: (c) => c.toggleQuote(),
    }),
    new SlashOption("code", {
      title: "Code block",
      subtitle: "Monospace code block.",
      icon: <Code2 className="h-5 w-5" />,
      keywords: ["code", "pre", "codeblock"],
      run: (c) => c.toggleCodeBlock(),
    }),
    new SlashOption("hr", {
      title: "Divider",
      subtitle: "Horizontal rule.",
      icon: <Minus className="h-5 w-5" />,
      keywords: ["hr", "divider", "rule", "---"],
      run: (c) => c.insertHorizontalRule(),
    }),
    new SlashOption("table", {
      title: "Table",
      subtitle: "3x3 table with header.",
      icon: <TableIcon className="h-5 w-5" />,
      keywords: ["table", "grid"],
      run: (c) =>
        c.insertTable({ rows: 3, columns: 3, includeHeaders: true }),
    }),
    new SlashOption("image", {
      title: "Image",
      subtitle: "Insert an image by URL.",
      icon: <ImageIcon className="h-5 w-5" />,
      keywords: ["image", "img", "picture"],
      run: (c) => {
        const src = window.prompt("Image URL");
        if (src) c.insertImage({ src, alt: "" });
      },
    }),
    new SlashOption("link", {
      title: "Link",
      subtitle: "Insert a hyperlink.",
      icon: <LinkIcon className="h-5 w-5" />,
      keywords: ["link", "url", "href", "hyperlink"],
      run: (c) => {
        const url = window.prompt("Link URL");
        if (url) c.insertLink(url);
      },
    }),
    new SlashOption("html", {
      title: "HTML embed",
      subtitle: "Raw HTML block.",
      icon: <CodeSquare className="h-5 w-5" />,
      keywords: ["html", "embed", "iframe"],
      run: (c) => c.insertHTMLEmbed("<div></div>"),
    }),
  ];
}

export function SlashMenu() {
  const { commands } = useLexKitEditor();
  const [query, setQuery] = useState<string | null>(null);

  const triggerFn = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
    maxLength: 30,
  });

  const allOptions = useMemo(() => buildOptions(), []);

  const options = useMemo(() => {
    if (!query) return allOptions;
    const q = query.toLowerCase();
    return allOptions.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.keywords.some((kw) => kw.startsWith(q) || kw.includes(q))
    );
  }, [allOptions, query]);

  const onSelectOption = useCallback(
    (
      selected: SlashOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void
    ) => {
      // Remove the trigger text (e.g. "/head") from the editor
      nodeToRemove?.remove();
      // Defer the command so Lexical processes the removal first
      requestAnimationFrame(() => {
        selected.run(commands);
      });
      closeMenu();
    },
    [commands]
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      onQueryChange={setQuery}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (!anchorElementRef.current || options.length === 0) return null;
        return createPortal(
          <div
            role="listbox"
            className="bn-slash-menu w-72 rounded-xl border border-border bg-popover p-1 shadow-xl backdrop-blur"
          >
            <div className="px-2 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              {query ? `/${query}` : "Basic blocks"}
            </div>
            <ul className="max-h-80 overflow-auto">
              {options.map((option, i) => (
                <li key={option.key}>
                  <button
                    type="button"
                    ref={option.setRefElement}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setHighlightedIndex(i);
                      selectOptionAndCleanUp(option);
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/60"
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-border bg-background">
                      {option.iconEl}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium leading-tight">
                        {option.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {option.subtitle}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
