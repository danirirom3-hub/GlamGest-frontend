import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const sourceRoot = join(root, 'src', 'app');
const localePaths = {
  es: join(root, 'src', 'assets', 'i18n', 'es.json'),
  en: join(root, 'src', 'assets', 'i18n', 'en.json')
};

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === 'object' && !Array.isArray(entry)
      ? flatten(entry, path)
      : [path];
  });
}

async function readSources(directory) {
  const files = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(files.map(async file => {
    const path = join(directory, file.name);
    if (file.isDirectory()) return readSources(path);
    if (!/\.(html|ts)$/.test(file.name) || file.name.endsWith('.spec.ts')) return [];
    return [{ path, content: await readFile(path, 'utf8') }];
  }))).flat();
}

const locales = Object.fromEntries(await Promise.all(Object.entries(localePaths).map(async ([language, path]) => {
  return [language, JSON.parse(await readFile(path, 'utf8'))];
})));
const keysByLanguage = Object.fromEntries(Object.entries(locales).map(([language, dictionary]) => [language, new Set(flatten(dictionary))]));
const sourceFiles = await readSources(sourceRoot);
const usedKeys = new Map();
const patterns = [
  /(['"`])([A-Za-z][\w.-]*)\1\s*\|\s*translate/g,
  /translate\.(?:instant|get)\(\s*(['"`])([A-Za-z][\w.-]*)\1/g,
  /\bkey:\s*(['"`])([A-Za-z][\w.-]*)\1/g
];

for (const file of sourceFiles) {
  for (const pattern of patterns) {
    for (const match of file.content.matchAll(pattern)) {
      const key = match[2];
      const locations = usedKeys.get(key) || [];
      locations.push(`${relative(root, file.path)}:${file.content.slice(0, match.index).split('\n').length}`);
      usedKeys.set(key, locations);
    }
  }
}

let failed = false;
const spanishKeys = keysByLanguage.es;
const englishKeys = keysByLanguage.en;
for (const key of spanishKeys) {
  if (!englishKeys.has(key)) {
    console.error(`Missing en translation key: ${key}`);
    failed = true;
  }
}
for (const key of englishKeys) {
  if (!spanishKeys.has(key)) {
    console.error(`Missing es translation key: ${key}`);
    failed = true;
  }
}
for (const [key, locations] of usedKeys) {
  for (const language of Object.keys(localePaths)) {
    if (!keysByLanguage[language].has(key)) {
      console.error(`Missing ${language} key '${key}' used at ${locations.join(', ')}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`Translation dictionaries are complete (${usedKeys.size} referenced keys checked).`);
