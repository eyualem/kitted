// DEV only: the camera guidance lines ([guide] …) go to the Metro log and to Documents/logs/guide.log (and the mic's
// [mic] lines to mic.log),
// so a test on his phone can be read afterwards with tools/phone/pull.sh even when Metro wasn't
// watched (DECISIONS-LOG #100). Never in Release. Kept under ~200 KB.
import { Directory, File, Paths } from 'expo-file-system';

const MAX_BYTES = 200_000;

export function guideLog(line: string) {
  devLog('guide.log', line);
}

/** The mic's stages ([mic] …, round 2 #302): Metro and Documents/logs/mic.log. Never his words, only counts. */
export function micLog(line: string) {
  devLog('mic.log', `[mic] ${line}`);
}

function devLog(file: string, line: string) {
  if (!__DEV__) return;
  console.log(line);
  try {
    const dir = new Directory(Paths.document, 'logs');
    if (!dir.exists) dir.create();
    const f = new File(dir, file);
    const old = f.exists ? f.textSync() : '';
    const kept = old.length > MAX_BYTES ? old.slice(old.length - MAX_BYTES / 2) : old;
    f.write(`${kept}${new Date().toISOString()} ${line}\n`);
  } catch {
    // web preview: no Documents folder
  }
}
