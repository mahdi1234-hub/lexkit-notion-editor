"use client";

import * as React from "react";
import { useState } from "react";
import { Sparkles, SendHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShiningText } from "@/components/ui/shining-text";
import { useLexKitEditor } from "./extensions";
import { insertPlainText } from "./insertHelpers";

export interface AIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDialog({ open, onOpenChange }: AIDialogProps) {
  const { editor, commands } = useLexKitEditor();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const runAI = async () => {
    if (!prompt.trim() || !editor) return;
    setError(null);
    setGenerating(true);
    setPreview(null);

    try {
      // Gather editor context
      let context = "";
      editor.getEditorState().read(() => {
        // lazy import to avoid SSR issues
      });
      try {
        context = commands.exportToMarkdown?.() ?? "";
      } catch {
        context = "";
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), context }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "AI request failed");
        setGenerating(false);
        return;
      }
      const content = (data.content ?? "").trim();
      if (!content) {
        setError("Empty response from AI");
        setGenerating(false);
        return;
      }
      setPreview(content);

      // Try to import as markdown at current selection; fall back to plain insert
      if (commands.importFromMarkdown) {
        // Appending: export current markdown, append AI output, re-import
        const current = commands.exportToMarkdown?.() ?? "";
        const next = current
          ? current.trimEnd() + "\n\n" + content + "\n"
          : content + "\n";
        await commands.importFromMarkdown(next, { preventFocus: false });
      } else {
        insertPlainText(editor, "\n" + content + "\n");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const close = () => {
    if (generating) return;
    setPrompt("");
    setPreview(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : onOpenChange(o))}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Ask AI
          </DialogTitle>
          <DialogDescription>
            Generate content with Cerebras Llama 3.1 8B. Markdown is imported
            into the editor automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            placeholder="e.g. Write a product launch blog post about our new note-taking app..."
            className="min-h-[120px] w-full resize-vertical rounded-md border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          {generating && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <ShiningText text="HextaAI is thinking..." />
            </div>
          )}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {preview && !generating && (
            <div className="max-h-48 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
              {preview}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={generating}>
            Close
          </Button>
          <Button onClick={runAI} disabled={!prompt.trim() || generating} className="gap-2">
            <SendHorizontal className="h-4 w-4" />
            {generating ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
