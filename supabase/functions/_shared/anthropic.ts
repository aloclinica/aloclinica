// Shared Anthropic Claude helper for AloClinica edge functions.
// Provides an OpenAI-compatible interface (chat.completions style) backed by
// Anthropic's Messages API, plus a streaming pass-through that emits
// OpenAI-shaped Server-Sent Events so existing client/SSE parsers keep working.

export const DEFAULT_CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
export const FAST_CLAUDE_MODEL = "claude-3-5-haiku-latest";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

export interface ClaudeOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system?: string;
  messages: ChatMessage[];
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function getKey(apiKey?: string): string {
  const key = apiKey || Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY não configurada");
  return key;
}

/** Split messages into system prompt + Anthropic-shaped message list. */
function normalize(messages: ChatMessage[], systemOverride?: string) {
  const systemParts: string[] = [];
  if (systemOverride) systemParts.push(systemOverride);

  const conv: Array<{ role: "user" | "assistant"; content: ChatMessage["content"] }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      if (typeof m.content === "string") systemParts.push(m.content);
      continue;
    }
    conv.push({ role: m.role, content: m.content });
  }

  // Anthropic requires the first message to be from the user.
  if (conv.length === 0 || conv[0].role !== "user") {
    conv.unshift({ role: "user", content: "(continuar)" });
  }

  return { system: systemParts.join("\n\n").trim(), messages: conv };
}

/** Non-streaming call returning plain text content. */
export async function callClaude(opts: ClaudeOptions): Promise<string> {
  const key = getKey(opts.apiKey);
  const { system, messages } = normalize(opts.messages, opts.system);

  const body: Record<string, unknown> = {
    model: opts.model || DEFAULT_CLAUDE_MODEL,
    max_tokens: opts.max_tokens ?? 1024,
    messages,
  };
  if (system) body.system = system;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Anthropic error:", res.status, errText);
    const err: any = new Error(`Anthropic API error: ${res.status}`);
    err.status = res.status;
    err.body = errText;
    throw err;
  }

  const data = await res.json();
  const parts = Array.isArray(data?.content) ? data.content : [];
  return parts
    .filter((p: { type?: string }) => p?.type === "text")
    .map((p: { text?: string }) => p.text || "")
    .join("");
}

/**
 * Streaming call. Returns a Response body (ReadableStream) that emits SSE
 * lines in the OpenAI Chat Completions format:
 *   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 *   data: [DONE]\n\n
 * This way existing frontends parsing OpenAI-style SSE keep working unchanged.
 */
export async function streamClaudeAsOpenAI(opts: ClaudeOptions): Promise<Response> {
  const key = getKey(opts.apiKey);
  const { system, messages } = normalize(opts.messages, opts.system);

  const body: Record<string, unknown> = {
    model: opts.model || DEFAULT_CLAUDE_MODEL,
    max_tokens: opts.max_tokens ?? 1024,
    stream: true,
    messages,
  };
  if (system) body.system = system;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error("Anthropic stream error:", upstream.status, errText);
    const err: any = new Error(`Anthropic API error: ${upstream.status}`);
    err.status = upstream.status;
    err.body = errText;
    throw err;
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).replace(/\r$/, "");
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;

            try {
              const evt = JSON.parse(payload);
              if (evt?.type === "content_block_delta" && evt?.delta?.type === "text_delta") {
                const text = evt.delta.text || "";
                if (text) {
                  const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
                  controller.enqueue(encoder.encode(sse));
                }
              } else if (evt?.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // ignore partial JSON line
            }
          }
        }
        if (!buffer.includes("[DONE]")) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
      } catch (e) {
        console.error("Claude stream relay error:", e);
      } finally {
        controller.close();
      }
    },
  });

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };

  return new Response(stream, {
    headers: { 
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    },
  });
}

/** Vision-capable call: pass mixed text + image_url content like OpenAI. */
export async function callClaudeVision(opts: {
  apiKey?: string;
  model?: string;
  prompt: string;
  imageDataUrl: string; // data:image/jpeg;base64,...
  max_tokens?: number;
  temperature?: number;
}): Promise<string> {
  const key = getKey(opts.apiKey);
  const m = opts.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("imageDataUrl deve ser uma data URL base64");
  const [_, mediaType, b64] = m;

  const body = {
    model: opts.model || DEFAULT_CLAUDE_MODEL,
    max_tokens: opts.max_tokens ?? 512,
    temperature: opts.temperature ?? 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
          { type: "text", text: opts.prompt },
        ],
      },
    ],
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Anthropic vision error:", res.status, t);
    throw new Error(`Anthropic vision error: ${res.status}`);
  }
  const data = await res.json();
  const parts = Array.isArray(data?.content) ? data.content : [];
  return parts
    .filter((p: { type?: string }) => p?.type === "text")
    .map((p: { text?: string }) => p.text || "")
    .join("");
}