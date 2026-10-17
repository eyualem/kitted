// Reads Gemini's answers on the way through, for the two things the server needs: the token counts (the spending
// stop) and whether the answer finished (only a finished answer counts). The bytes themselves are relayed untouched.
import type { Usage } from './prices';

interface Chunk {
  candidates?: { finishReason?: string }[];
  usageMetadata?: Usage;
  /** OpenAI's Responses API events (13 §11). */
  type?: string;
  response?: { usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } };
}

const OPENAI_END = ['response.completed', 'response.incomplete', 'response.failed'];

export interface Seen {
  usage?: Usage;
  finishReason?: string;
}

function take(seen: Seen, j: Chunk) {
  // OpenAI: the last event carries the usage; only "completed" is a finished answer (its output includes reasoning).
  if (j.type && OPENAI_END.includes(j.type)) {
    const u = j.response?.usage;
    if (u) seen.usage = { promptTokenCount: u.input_tokens ?? 0, cachedContentTokenCount: u.input_tokens_details?.cached_tokens ?? 0, candidatesTokenCount: u.output_tokens ?? 0 };
    seen.finishReason = j.type === 'response.completed' ? 'STOP' : j.type;
    return;
  }
  if (j.type === 'error') {
    seen.finishReason = 'error';
    return;
  }
  if (j.usageMetadata) seen.usage = j.usageMetadata;
  const f = j.candidates?.[0]?.finishReason;
  if (f) seen.finishReason = f;
}

/** Feed it the SSE text as it arrives; `seen` holds the newest counts and finish reason. */
export function sseScanner() {
  const decoder = new TextDecoder();
  let buf = '';
  const seen: Seen = {};
  const events = (text: string, final: boolean) => {
    buf += text;
    const parts = buf.split(/\r?\n\r?\n/);
    buf = final ? '' : parts.pop() ?? '';
    for (const ev of parts) {
      const data = ev.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
      if (!data) continue;
      try {
        take(seen, JSON.parse(data) as Chunk);
      } catch {
        // not JSON: nothing to read
      }
    }
  };
  return {
    seen,
    push(bytes: Uint8Array) {
      events(decoder.decode(bytes, { stream: true }), false);
    },
    end() {
      events(decoder.decode(), true);
    },
  };
}

/** The same two facts from a one-reply answer. */
export function readReply(text: string): Seen {
  const seen: Seen = {};
  try {
    take(seen, JSON.parse(text) as Chunk);
  } catch {
    // not JSON
  }
  return seen;
}
