"use client";

import * as React from "react";
import { useState } from "react";
import { RichText } from "@lexkit/editor";
import { LexKitProvider, extensions } from "./extensions";
import { EditorToolbar } from "./EditorToolbar";
import { SlashMenu } from "./SlashMenu";
import { VoiceDialog } from "./VoiceDialog";
import { AIDialog } from "./AIDialog";

export function Editor() {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <LexKitProvider extensions={extensions}>
      <div className="lexkit-wrapper relative w-full">
        <RichText
          placeholder="Start writing, or press '/' for commands..."
          classNames={{
            container: "lexkit-container",
            contentEditable: "lexkit-content",
            placeholder: "lexkit-placeholder",
          }}
        />
        <SlashMenu />
        <EditorToolbar
          onOpenVoice={() => setVoiceOpen(true)}
          onOpenAI={() => setAiOpen(true)}
        />
        <VoiceDialog open={voiceOpen} onOpenChange={setVoiceOpen} />
        <AIDialog open={aiOpen} onOpenChange={setAiOpen} />
      </div>
    </LexKitProvider>
  );
}
