import rss from '@astrojs/rss';
import { getPostDate, getPublishedPosts, getPostDescription, getPostTitle, getPostUrl } from '@/lib/posts';

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: '10cheon00의 Archive',
    description: 'A blog archiving what I learned.',
    site: context.site,
    items: posts.map((post) => ({
      title: getPostTitle(post),
      description: getPostDescription(post),
      pubDate: getPostDate(post),
      link: getPostUrl(post)
    }))
  });
}
