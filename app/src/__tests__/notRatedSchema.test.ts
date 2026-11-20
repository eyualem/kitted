// T61 · NR9.1: the reader's schema and prompt know the new names (specs/not-rated.md NR9). Logic only: the JSON files
// the app sends to Gemini. Whether Gemini names them right on real photos is Y55 (paid), not here. No network, $0.
import schema from '../../assets/gemini/schema-v3.json';
import promptFile from '../../assets/gemini/prompt-v3.json';

const sub = (schema as any).properties.garments.items.properties.subcategory.enum as string[];
const scene = (schema as any).properties.scene;
const prompt: string = (promptFile as any).prompt;
const lines = prompt.split('\n');
const NEW_SUBS = ['dress', 'skirt', 'heels', 'traditional_shoe'];
/** The lines of the prompt that name `token` as a word (underscore-joined names like dress_shirt don't count). */
const naming = (token: string) => lines.filter((l) => new RegExp(`(?<![A-Za-z_])${token}(?![A-Za-z_])`).test(l));

describe('NR9.1 · the schema', () => {
  it('NR9.1 · the garment subcategory enum gains exactly dress, skirt, heels and traditional_shoe', () => {
    for (const s of NEW_SUBS) expect(sub).toContain(s);
    expect(sub.length).toBe(64);
    expect(new Set(sub).size).toBe(64);
    expect(sub).toContain('other');
    expect(sub).toContain('dress_shirt');
  });
  it('NR9.1 · scene has a boolean costume_or_uniform, required like the other scene fields', () => {
    expect(scene.properties.costume_or_uniform).toEqual({ type: 'BOOLEAN' });
    expect(scene.required).toEqual(['framing', 'shoes_visible', 'people_count', 'mirror_selfie', 'lighting', 'clothed', 'costume_or_uniform']);
  });
  it('NR9.1 · the other scene fields are unchanged', () => {
    expect(scene.properties.shoes_visible).toEqual({ type: 'BOOLEAN' });
    expect(scene.properties.clothed).toEqual({ type: 'STRING', enum: ['fully', 'partial'] });
    expect(Object.keys(scene.properties)).toEqual(['framing', 'shoes_visible', 'people_count', 'mirror_selfie', 'lighting', 'clothed', 'costume_or_uniform']);
  });
});

describe('NR9.1 · the prompt', () => {
  it('NR9.1 · names each new subcategory and the flag in exactly one line each', () => {
    for (const t of [...NEW_SUBS, 'costume_or_uniform']) expect([t, naming(t).length]).toEqual([t, 1]);
    for (const l of lines) {
      const hits = [...NEW_SUBS, 'costume_or_uniform'].filter((t) => naming(t).includes(l));
      expect([l, hits.length <= 1]).toEqual([l, true]);
    }
  });
  it('NR9.1 · still says describe the clothes only, never rate the person', () => {
    expect(prompt).toContain('Describe ONLY the garments the main person is wearing');
    expect(prompt).toContain('Never rate, score, or judge the outfit, the person, their face, body, weight, or skin. Only describe clothing.');
  });
  it('NR9.1 · the closing instruction is kept', () => {
    expect(prompt.trimEnd().endsWith('Return only JSON that matches the schema.')).toBe(true);
  });
});
