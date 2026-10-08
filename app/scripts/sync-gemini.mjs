// Copies the locked extraction prompts + schemas (extraction-test/) into the app byte-for-byte:
//   the scoring call (Oct 6 lock: v3 format) and the closet call (closet1, DECISIONS-LOG #90-91).
// Run after changing any of them there; geminiRequest / closetSource tests fail on drift.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', '..', 'extraction-test');
const out = path.resolve(import.meta.dirname, '..', 'assets', 'gemini');
fs.mkdirSync(out, { recursive: true });
const prompt = fs.readFileSync(path.join(root, 'prompt.txt'), 'utf8');
fs.writeFileSync(path.join(out, 'prompt-v3.json'), JSON.stringify({ prompt }, null, 1) + '\n');
fs.copyFileSync(path.join(root, 'schema.json'), path.join(out, 'schema-v3.json'));
const closetPrompt = fs.readFileSync(path.join(root, 'prompt_closet_v1.txt'), 'utf8');
fs.writeFileSync(path.join(out, 'prompt-closet-v1.json'), JSON.stringify({ prompt: closetPrompt }, null, 1) + '\n');
fs.copyFileSync(path.join(root, 'schema_closet_v1.json'), path.join(out, 'schema-closet-v1.json'));
console.log('synced prompt-v3.json, schema-v3.json, prompt-closet-v1.json and schema-closet-v1.json');
