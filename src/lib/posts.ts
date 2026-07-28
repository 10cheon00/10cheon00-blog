import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export function getPostTitle(post: BlogPost) {
  return post.data.title ?? titleFromSlug(post.id);
}

export function getPostDescription(post: BlogPost) {
  return post.data.description ?? `${getPostTitle(post)} 글입니다.`;
}

export function getPostDate(post: BlogPost) {
  return post.data.date ?? new Date('1970-01-01T00:00:00.000Z');
}

export function getCategory(post: BlogPost) {
  const category = post.data.category;
  if (!category) return post.id.split('/')[0] ?? 'posts';
  return typeof category === 'string' ? category : category.name;
}

export function getPostUrl(post: BlogPost) {
  return `/blog/${post.id.replace(/\/index$/, '')}/`;
}

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => getPostDate(b).getTime() - getPostDate(a).getTime());
}

export function getAllTags(posts: BlogPost[]) {
  return [...new Set(posts.flatMap((post) => post.data.tags ?? []))].sort((a, b) => a.localeCompare(b));
}

export function getAllCategories(posts: BlogPost[]) {
  return [...new Set(posts.map(getCategory))].sort((a, b) => a.localeCompare(b));
}

export function formatDate(date?: Date) {
  if (!date || date.getTime() === 0) return '날짜 없음';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
}

function titleFromSlug(id: string) {
  const segment = id.replace(/\/index$/, '').split('/').at(-1) ?? id;
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, ' ')
    .replace(/\.mdx?$/, '');
}
