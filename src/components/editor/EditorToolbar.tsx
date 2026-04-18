"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Link as LinkIcon,
  Mic,
  Sparkles,
} from "lucide-react";
import Draggable from "react-draggable";
import { AnimatedDock } from "@/components/ui/animated-dock";
import { useLexKitEditor } from "./extensions";

export interface EditorToolbarProps {
  onOpenVoice: () => void;
  onOpenAI: () => void;
}

export function EditorToolbar({ onOpenVoice, onOpenAI }: EditorToolbarProps) {
  const { commands, activeStates } = useLexKitEditor();
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const items = [
    {
      Icon: <Undo2 size={18} />,
      label: "Undo",
      onClick: () => commands.undo(),
    },
    {
      Icon: <Redo2 size={18} />,
      label: "Redo",
      onClick: () => commands.redo(),
    },
    {
      Icon: <Heading1 size={18} />,
      label: "Heading 1",
      onClick: () => commands.toggleHeading("h1"),
    },
    {
      Icon: <Heading2 size={18} />,
      label: "Heading 2",
      onClick: () => commands.toggleHeading("h2"),
    },
    {
      Icon: <Bold size={18} />,
      label: "Bold",
      active: !!activeStates.bold,
      onClick: () => commands.toggleBold(),
    },
    {
      Icon: <Italic size={18} />,
      label: "Italic",
      active: !!activeStates.italic,
      onClick: () => commands.toggleItalic(),
    },
    {
      Icon: <Underline size={18} />,
      label: "Underline",
      active: !!activeStates.underline,
      onClick: () => commands.toggleUnderline(),
    },
    {
      Icon: <Strikethrough size={18} />,
      label: "Strikethrough",
      active: !!activeStates.strikethrough,
      onClick: () => commands.toggleStrikethrough(),
    },
    {
      Icon: <Code size={18} />,
      label: "Inline code",
      onClick: () => commands.toggleCode?.(),
    },
    {
      Icon: <List size={18} />,
      label: "Bullet list",
      active: !!activeStates.unorderedList,
      onClick: () => commands.toggleUnorderedList(),
    },
    {
      Icon: <ListOrdered size={18} />,
      label: "Numbered list",
      active: !!activeStates.orderedList,
      onClick: () => commands.toggleOrderedList(),
    },
    {
      Icon: <Quote size={18} />,
      label: "Quote",
      onClick: () => commands.toggleQuote(),
    },
    {
      Icon: <Minus size={18} />,
      label: "Divider",
      onClick: () => commands.insertHorizontalRule(),
    },
    {
      Icon: <TableIcon size={18} />,
      label: "Table",
      onClick: () =>
        commands.insertTable({ rows: 3, columns: 3, includeHeaders: true }),
    },
    {
      Icon: <ImageIcon size={18} />,
      label: "Image",
      onClick: () => {
        const src = window.prompt("Image URL");
        if (src) commands.insertImage({ src, alt: "" });
      },
    },
    {
      Icon: <LinkIcon size={18} />,
      label: "Link",
      active: !!activeStates.isLink,
      onClick: () => {
        const url = window.prompt("Link URL");
        if (url) commands.insertLink(url);
      },
    },
    {
      Icon: <Mic size={18} />,
      label: "Voice transcription",
      onClick: onOpenVoice,
    },
    {
      Icon: <Sparkles size={18} />,
      label: "Ask AI",
      onClick: onOpenAI,
    },
  ];

  return (
    <Draggable handle=".dock-handle" nodeRef={nodeRef} defaultClassName="">
      <div
        ref={nodeRef}
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 select-none"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="dock-handle h-1 w-12 cursor-grab rounded-full bg-foreground/20 active:cursor-grabbing" />
          <AnimatedDock items={items} />
        </div>
      </div>
    </Draggable>
  );
}
