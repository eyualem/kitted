// The error log (09-ui-review §23 E2–E4, #353): a beta tester's crash leaves one short line on the phone, in every
// build (Release too), at Documents/logs/errors.log. tools/phone/pull.sh prints it; "Delete all my data" removes it
// (Documents/logs goes whole). Nothing is sent anywhere: a crash-reporting service is a package and his call (§20.1
// item 6). A line holds the time, where it happened, the error's name and message (cut to 200 characters) and at most
// five stack frames, never anything he typed beyond what an error message itself carries.
import { Directory, File, Paths } from 'expo-file-system';

export type ErrorWhere = 'render' | 'fatal' | 'js';

/** The file stays under this; past it the newest half is kept. */
export const LOG_MAX_BYTES = 100_000;
const MESSAGE_MAX = 200;
const STACK_LINES = 5;

/** One line for the log, ending in a newline. */
export function errorLine(error: unknown, where: ErrorWhere, nowMs: number): string {
  const e = error instanceof Error ? error : null;
  const name = e?.name || 'Error';
  const raw = e ? e.message : typeof error === 'string' ? error : '';
  const message = oneLine(raw).slice(0, MESSAGE_MAX);
  const frames = (e?.stack ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('at ') || /@/.test(l))
    .slice(0, STACK_LINES);
  return `${new Date(nowMs).toISOString()} ${where} ${name}: ${message}${frames.length ? ` | ${frames.join(' | ')}` : ''}\n`;
}

/** The log's newest half, from a whole line on, once it's past LOG_MAX_BYTES. */
export function keepTail(text: string): string {
  if (text.length <= LOG_MAX_BYTES) return text;
  const tail = text.slice(text.length - LOG_MAX_BYTES / 2);
  const cut = tail.indexOf('\n');
  return cut === -1 ? '' : tail.slice(cut + 1);
}

/** Appends one line to Documents/logs/errors.log. Never throws (the web preview has no Documents folder). */
export function recordError(error: unknown, where: ErrorWhere): void {
  try {
    const dir = new Directory(Paths.document, 'logs');
    if (!dir.exists) dir.create();
    const f = new File(dir, 'errors.log');
    const old = f.exists ? f.textSync() : '';
    f.write(`${keepTail(old)}${errorLine(error, where, Date.now())}`);
  } catch {
    // nothing to do: the log is a convenience
  }
}

type Handler = (error: unknown, isFatal?: boolean) => void;
interface ErrorUtilsLike {
  getGlobalHandler(): Handler;
  setGlobalHandler(h: Handler): void;
}

let installed = false;

/**
 * Records every uncaught JS error, then hands it to the handler that was there (the dev red box, React Native's own
 * crash in Release), so nothing else changes. Once per launch; `fresh` is for tests.
 */
export function installErrorHandler(record: (error: unknown, where: ErrorWhere) => void = recordError, o: { fresh?: boolean } = {}): void {
  if (installed && !o.fresh) return;
  const utils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (!utils) return;
  installed = true;
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, isFatal) => {
    try {
      record(error, isFatal ? 'fatal' : 'js');
    } catch {
      // the log must never get in the way of the real handler
    }
    previous(error, isFatal);
  });
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
