import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const oldBlogDir = path.join(workspaceRoot, 'old-blog', 'content', 'blog');
const contentDir = path.join(projectRoot, 'src', 'content', 'blog');
const freertosDir = path.join(contentDir, 'freertos');
const publicDir = path.join(projectRoot, 'public');

const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf']);

await mkdir(contentDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

await copyOldBlog();
await copyRootMarkdown();
await copyRootAssets();

console.log('Migration complete.');

async function copyOldBlog() {
  try {
    await stat(oldBlogDir);
  } catch {
    console.warn(`Skipped old blog: ${oldBlogDir} not found.`);
    return;
  }

  await cp(oldBlogDir, contentDir, { recursive: true, force: true });
}

async function copyRootMarkdown() {
  await rm(freertosDir, { recursive: true, force: true });
  await mkdir(freertosDir, { recursive: true });

  const entries = await readdir(workspaceRoot, { withFileTypes: true });
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name);

  for (const file of markdownFiles) {
    await cp(path.join(workspaceRoot, file), path.join(freertosDir, file), { force: true });
  }
}

async function copyRootAssets() {
  const entries = await readdir(workspaceRoot, { withFileTypes: true });
  const assetFiles = entries
    .filter((entry) => entry.isFile() && assetExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  for (const file of assetFiles) {
    await copyAssetWithNormalizedAlias(path.join(workspaceRoot, file), publicDir, file);
    await copyAssetWithNormalizedAlias(path.join(workspaceRoot, file), freertosDir, file);
  }
}

async function copyAssetWithNormalizedAlias(source, targetDir, file) {
  await cp(source, path.join(targetDir, file), { force: true });

  const normalized = file.normalize('NFC');
  if (normalized !== file) {
    await cp(source, path.join(targetDir, normalized), { force: true });
  }
}
