import { Editor } from "@/components/editor/Editor";
import { Flower } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Notion-style dotted grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_16%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
      />
      {/* Soft radial fade so edges of the dotted pattern feel airy like Notion */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_70%)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flower className="h-5 w-5" />
          <span>LexKit Notion Editor</span>
        </div>
        <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          AI • Voice • Slash commands
        </span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-40 pt-10">
        <h1 className="mb-1 text-4xl font-semibold tracking-tight">
          Untitled
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Powered by LexKit · BlockNote-style slash menu · Cerebras Llama 3.1 8B
        </p>
        <Editor />
      </main>
    </div>
  );
}
