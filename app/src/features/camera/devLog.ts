// DEV only: the camera guidance lines ([guide] …) go to the Metro log and to Documents/logs/guide.log,
// so a test on his phone can be read afterwards with tools/phone/pull.sh even when Metro wasn't
// watched (DECISIONS-LOG #100). Never in Release. Kept under ~200 KB.
import { Directory, File, Paths } from 'expo-file-system';

const MAX_BYTES = 200_000;

export function guideLog(line: string) {
  if (!__DEV__) return;
  console.log(line);
  try {
    const dir = new Directory(Paths.document, 'logs');
    if (!dir.exists) dir.create();
    const f = new File(dir, 'guide.log');
    const old = f.exists ? f.textSync() : '';
    const kept = old.length > MAX_BYTES ? old.slice(old.length - MAX_BYTES / 2) : old;
    f.write(`${kept}${new Date().toISOString()} ${line}\n`);
  } catch {
    // web preview: no Documents folder
  }
}
