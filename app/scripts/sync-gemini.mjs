// Copies the locked extraction prompt + schema (extraction-test/, Oct 6 lock: v3 format) into the
// app byte-for-byte. Run after changing either file there; geminiRequest.test.ts fails on drift.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..', '..', 'extraction-test');
const out = path.resolve(import.meta.dirname, '..', 'assets', 'gemini');
fs.mkdirSync(out, { recursive: true });
const prompt = fs.readFileSync(path.join(root, 'prompt.txt'), 'utf8');
fs.writeFileSync(path.join(out, 'prompt-v3.json'), JSON.stringify({ prompt }, null, 1) + '\n');
fs.copyFileSync(path.join(root, 'schema.json'), path.join(out, 'schema-v3.json'));
console.log('synced prompt-v3.json and schema-v3.json');
