"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLexKitEditor } from "./extensions";

export interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function VoiceDialog({ open, onOpenChange }: VoiceDialogProps) {
  const { commands } = useLexKitEditor();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);

  const stopAll = React.useCallback(() => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);
  }, []);

  useEffect(() => {
    if (open) return;
    stopAll();
  }, [open, stopAll]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setElapsed(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(
        "Microphone permission denied. Allow mic access to record your voice."
      );
      return;
    }
    mediaStreamRef.current = stream;

    const mimeCandidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    const mimeType =
      mimeCandidates.find(
        (m) =>
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(m)
      ) || undefined;

    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      setError("This browser cannot record audio (MediaRecorder unavailable).");
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || "audio/webm",
      });
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
    };
    mr.start(250);

    const startedAt = performance.now();
    tickRef.current = window.setInterval(() => {
      setElapsed((performance.now() - startedAt) / 1000);
    }, 200);

    setRecording(true);
  };

  const stopRecording = () => {
    stopAll();
  };

  const reset = () => {
    stopAll();
    setElapsed(0);
    setError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const insertIntoEditor = async () => {
    if (!audioBlob) return;
    try {
      const dataUrl = await blobToDataURL(audioBlob);
      const mime = audioBlob.type || "audio/webm";
      const html = `<audio controls preload="metadata" src="${dataUrl}" data-type="${mime}"></audio>`;
      commands.insertHTMLEmbed(html);
      onOpenChange(false);
    } catch {
      setError("Could not insert the recording.");
    }
  };

  const sizeKb = audioBlob ? Math.round(audioBlob.size / 1024) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" /> Voice recorder
          </DialogTitle>
          <DialogDescription>
            Record your voice, listen back, then insert an audio player into
            the document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {!recording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4" /> Start recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="gap-2"
              >
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={reset}
              disabled={recording}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> Reset
            </Button>
            <div className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
              {recording ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  {formatDuration(elapsed)}
                </span>
              ) : audioBlob ? (
                <span>
                  {formatDuration(elapsed)} · {sizeKb} KB
                </span>
              ) : (
                <span>00:00</span>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/30 p-3">
            {audioUrl ? (
              <audio
                controls
                src={audioUrl}
                className="w-full"
                preload="metadata"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {recording
                  ? "Recording… speak now."
                  : "Your recording will appear here."}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={insertIntoEditor}
            disabled={!audioBlob || recording}
          >
            Insert audio into editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
