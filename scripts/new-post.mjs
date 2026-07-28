import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , rawTitle, rawCategory = 'posts'] = process.argv;

if (!rawTitle) {
  console.error('Usage: npm run new:post -- "글 제목" [category]');
  process.exit(1);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const date = new Date();
const slug = slugify(rawTitle);
const category = slugify(rawCategory);
const postDir = path.join(projectRoot, 'src', 'content', 'blog', category, slug);
const postPath = path.join(postDir, 'index.md');

await mkdir(postDir, { recursive: true });
await writeFile(
  postPath,
  `---\ntitle: ${JSON.stringify(rawTitle)}\ndate: ${date.toISOString()}\ndescription: ""\ntags: []\ncategory:\n  name: ${JSON.stringify(rawCategory)}\ndraft: true\n---\n\n# ${rawTitle}\n`,
  { flag: 'wx' }
);

console.log(postPath);

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}
