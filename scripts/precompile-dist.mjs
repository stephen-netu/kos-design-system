import { compile } from 'svelte/compiler';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, callback);
    else callback(full);
  }
}

let compiled = 0;
let skipped = 0;

walk(distDir, (file) => {
  if (!file.endsWith('.svelte')) return;
  if (file.endsWith('.d.ts') || file.endsWith('.d.ts.map')) return;

  const outFile = file.replace(/\.svelte$/, '.svelte.js');

  // Skip if already has compiled version
  if (fs.existsSync(outFile)) {
    skipped++;
    return;
  }

  const source = fs.readFileSync(file, 'utf-8');

  try {
    const result = compile(source, {
      generate: 'client',
      filename: path.basename(file),
      runes: true,
    });

    fs.writeFileSync(outFile, result.js.code);
    compiled++;
  } catch (e) {
    console.error(`FAIL: ${file} — ${e.message}`);
  }
});

console.log(`Compiled: ${compiled}, Skipped (already exist): ${skipped}`);
