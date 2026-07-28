import { cp, mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(projectRoot, 'src', 'content', 'blog');
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);

const categories = (await readdir(blogDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== 'assets')
  .map((entry) => entry.name);

let movedImages = 0;
let updatedDocuments = 0;

for (const category of categories) {
  const categoryDir = path.join(blogDir, category);
  const assetsDir = path.join(categoryDir, 'assets');
  const files = await walk(categoryDir);
  const imageMoves = new Map();

  await mkdir(assetsDir, { recursive: true });
  await writeFile(path.join(assetsDir, '.gitkeep'), '');

  for (const file of files) {
    if (isInside(file, assetsDir) || !imageExtensions.has(path.extname(file).toLowerCase())) {
      continue;
    }

    const relativeSource = path.relative(categoryDir, file);
    const destination = path.join(assetsDir, relativeSource);
    imageMoves.set(normalizePath(file), destination);
  }

  for (const file of files) {
    if (!['.md', '.mdx'].includes(path.extname(file).toLowerCase())) {
      continue;
    }

    const original = await readFile(file, 'utf8');
    const updated = rewriteImageReferences(original, file, categoryDir, imageMoves);

    if (updated !== original) {
      await writeFile(file, updated);
      updatedDocuments++;
    }
  }

  for (const [source, destination] of imageMoves) {
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { force: true });
    await unlink(source);
    movedImages++;
  }
}

console.log(`Organized ${movedImages} images and updated ${updatedDocuments} documents.`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function rewriteImageReferences(markdown, documentPath, categoryDir, imageMoves) {
  const rewrite = (reference) => {
    const trimmed = reference.trim();

    if (
      !trimmed ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return reference;
    }

    const unwrapped =
      trimmed.startsWith('<') && trimmed.endsWith('>') ? trimmed.slice(1, -1) : trimmed;
    const cleanReference = unwrapped.split('#', 1)[0].split('?', 1)[0];
    const decodedReference = safeDecode(cleanReference);
    const source = decodedReference.startsWith('/')
      ? path.join(categoryDir, decodedReference.slice(1))
      : path.resolve(path.dirname(documentPath), decodedReference);
    const destination = imageMoves.get(normalizePath(source));

    if (!destination) {
      return reference;
    }

    let relativeDestination = path
      .relative(path.dirname(documentPath), destination)
      .split(path.sep)
      .join('/');

    if (!relativeDestination.startsWith('.')) {
      relativeDestination = `./${relativeDestination}`;
    }

    return `<${relativeDestination}>`;
  };

  return markdown
    .replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (_, opening, reference, closing) => {
      return `${opening}${rewrite(reference)}${closing}`;
    })
    .replace(/(<(?:img|source)\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (_, opening, reference, closing) => {
      return `${opening}${rewrite(reference).replace(/^<|>$/g, '')}${closing}`;
    });
}

function normalizePath(filePath) {
  return path.resolve(filePath).normalize('NFC');
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isInside(file, directory) {
  const relative = path.relative(directory, file);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
