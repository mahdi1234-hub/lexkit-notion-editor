"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Trash2 } from "lucide-react";
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
import { insertPlainText } from "./insertHelpers";

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceDialog({ open, onOpenChange }: VoiceDialogProps) {
  const { editor } = useLexKitEditor();
  const [recording, setRecording] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopAll = React.useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => {
    if (open) return;
    // When dialog closes, tear down any active capture.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    stopAll();
  }, [open, stopAll]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    setFinalText("");
    setInterimText("");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const SR = getSpeechRecognition();
    if (!SR) {
      setError("SpeechRecognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mr.start();
    } catch {
      setError(
        "Microphone permission denied. Allow mic access to use voice transcription."
      );
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) finalChunk += text;
        else interimChunk += text;
      }
      if (finalChunk) setFinalText((prev) => (prev + " " + finalChunk).trim());
      setInterimText(interimChunk);
    };
    rec.onerror = (e) => {
      setError(`Recognition error: ${e.error}`);
    };
    rec.onend = () => {
      // auto-restart if still supposed to be recording
      if (recordingRef.current) {
        try {
          rec.start();
        } catch {}
      }
    };

    recordingRef.current = true;
    try {
      rec.start();
    } catch {
      setError("Could not start speech recognition.");
      return;
    }
    setRecording(true);
  };

  const recordingRef = useRef(false);

  const stopRecording = () => {
    recordingRef.current = false;
    stopAll();
  };

  const insertIntoEditor = () => {
    const combined = [finalText, interimText].filter(Boolean).join(" ").trim();
    if (!combined || !editor) return;
    insertPlainText(editor, combined + " ");
    onOpenChange(false);
  };

  const reset = () => {
    stopAll();
    recordingRef.current = false;
    setFinalText("");
    setInterimText("");
    setError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" /> Voice transcription
          </DialogTitle>
          <DialogDescription>
            Dictate content; it will be transcribed live and injected into the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            {!recording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4" /> Start recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            <Button variant="ghost" onClick={reset} className="gap-2">
              <Trash2 className="h-4 w-4" /> Reset
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="min-h-[96px] rounded-md border border-border bg-muted/30 p-3 text-sm">
            <span>{finalText}</span>{" "}
            <span className="text-muted-foreground">{interimText}</span>
            {!finalText && !interimText && (
              <span className="text-muted-foreground">
                Transcription will appear here...
              </span>
            )}
          </div>

          {audioUrl && (
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={insertIntoEditor} disabled={!finalText && !interimText}>
            Insert into editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
