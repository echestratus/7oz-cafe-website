import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageMain } from '@/components/layout/page-main';
import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { BlogArticleBody } from '@/features/blogs/components/blog-article-body';
import { fallbackBlogPosts, getPublishedBlogBySlug } from '@/services/blog';
import { getPublishedCmsPage } from '@/services/cms';

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post =
    (await getPublishedBlogBySlug(slug).catch(() => null)) ??
    fallbackBlogPosts.find((item) => item.slug === slug) ??
    null;

  if (!post) {
    return { title: 'Story not found' };
  }

  const description = post.excerpt || post.title;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      title: `${post.title} | 7Oz Espresso Cafe`,
      description,
      url: `/blogs/${post.slug}`,
      type: 'article',
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [footer, post] = await Promise.all([
    getPublishedCmsPage('footer'),
    getPublishedBlogBySlug(slug).catch(
      () => fallbackBlogPosts.find((item) => item.slug === slug) ?? null,
    ),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <SiteShell footer={footer}>
      <PageMain>
        <Container>
          <article className="mx-auto max-w-3xl">
            <Reveal>
              <header className="space-y-5 text-center md:space-y-6">
                <p className="text-eyebrow">{post.kind === 'event' ? 'Event' : 'News'}</p>
                <h1 className="text-page-title text-balance text-text">{post.title}</h1>
                {post.publishedAt ? (
                  <time
                    className="block text-sm tracking-wide text-text-muted"
                    dateTime={post.publishedAt}
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                ) : null}
              </header>
            </Reveal>

            {post.coverUrl ? (
              <Reveal delay={0.04} className="mt-12 md:mt-14">
                <div className="relative aspect-[16/10] overflow-hidden rounded-media shadow-[var(--shadow-soft)]">
                  <Image
                    src={post.coverUrl}
                    alt={post.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.08} className="mt-12 md:mt-16">
              <BlogArticleBody body={post.body} excerpt={post.excerpt} />
            </Reveal>

            <Reveal delay={0.12} className="mt-16 border-t border-border pt-8">
              <Link href="/blogs" className="text-link-quiet">
                Back to blogs
              </Link>
            </Reveal>
          </article>
        </Container>
      </PageMain>
    </SiteShell>
  );
}
