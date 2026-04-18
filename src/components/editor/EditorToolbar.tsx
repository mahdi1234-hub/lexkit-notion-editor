"use client";

import * as React from "react";
import { Mic, Sparkles } from "lucide-react";
import Draggable from "react-draggable";
import { AnimatedDock } from "@/components/ui/animated-dock";

export interface EditorToolbarProps {
  onOpenVoice: () => void;
  onOpenAI: () => void;
}

export function EditorToolbar({ onOpenVoice, onOpenAI }: EditorToolbarProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const items = [
    {
      Icon: <Mic size={22} />,
      label: "Voice transcription",
      onClick: onOpenVoice,
    },
    {
      Icon: <Sparkles size={22} />,
      label: "Ask AI",
      onClick: onOpenAI,
    },
  ];

  return (
    <Draggable handle=".dock-handle" nodeRef={nodeRef} defaultClassName="">
      <div
        ref={nodeRef}
        className="fixed right-6 top-1/2 z-40 -translate-y-1/2 select-none"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="dock-handle h-1 w-10 cursor-grab rounded-full bg-foreground/20 active:cursor-grabbing" />
          <AnimatedDock items={items} orientation="vertical" />
        </div>
      </div>
    </Draggable>
  );
}
