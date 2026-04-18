import { NextRequest } from "next/server";

export const runtime = "edge";

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";

export async function POST(req: NextRequest) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "CEREBRAS_API_KEY not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { prompt?: string; context?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const context = (body.context ?? "").trim();

  const system =
    "You are an expert writing assistant embedded inside a rich text editor. " +
    "Produce clean, well-structured content in plain Markdown (use #, ##, -, 1., **bold**, *italic*, `code`, fenced code blocks, > blockquotes). " +
    "Do NOT wrap the entire response in a code fence. Do NOT add commentary before or after. " +
    "Write the content the user asks for directly.";

  const userMessage = context
    ? `Current document context (for reference only, don't repeat it):\n---\n${context}\n---\n\nUser request: ${prompt}`
    : prompt;

  const cerebrasRes = await fetch(CEREBRAS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!cerebrasRes.ok) {
    const text = await cerebrasRes.text();
    return new Response(
      JSON.stringify({ error: "Cerebras error", status: cerebrasRes.status, detail: text }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = (await cerebrasRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";

  return new Response(JSON.stringify({ content }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
