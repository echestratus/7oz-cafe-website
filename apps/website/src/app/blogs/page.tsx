import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { BlogPostCard } from '@/features/blogs/components/blog-post-card';
import { fallbackBlogPosts, listPublishedBlogs } from '@/services/blog';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Blogs',
  description: 'News and events from 7Oz Espresso Cafe.',
  alternates: { canonical: '/blogs' },
  openGraph: {
    title: 'Blogs | 7Oz Espresso Cafe',
    description: 'News and events from 7Oz Espresso Cafe.',
    url: '/blogs',
  },
};

export default async function BlogsPage() {
  const [footer, blogResult] = await Promise.all([
    getPublishedCmsPage('footer'),
    listPublishedBlogs(1, 24).catch(() => ({
      items: fallbackBlogPosts,
      page: 1,
      limit: 24,
      total: fallbackBlogPosts.length,
    })),
  ]);

  const posts = blogResult.items;

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container>
          <Reveal className="mb-14">
            <SectionIntro
              eyebrow="Blogs"
              title="News & Events"
              description="Openings, visits, and stories from the 7Oz community."
              titleAs="h1"
            />
          </Reveal>

          {posts.length === 0 ? (
            <p className="text-lede">Stories will appear here soon.</p>
          ) : (
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {posts.map((post, index) => (
                <BlogPostCard key={post.id} post={post} delay={(index % 6) * 0.04} />
              ))}
            </div>
          )}
        </Container>
      </main>
    </SiteShell>
  );
}
