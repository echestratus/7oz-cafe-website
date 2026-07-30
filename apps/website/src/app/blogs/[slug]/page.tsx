import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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

  const paragraphs = post.body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container className="max-w-3xl">
          <Reveal className="space-y-6">
            <p className="text-eyebrow">{post.kind === 'event' ? 'Event' : 'News'}</p>
            <h1 className="text-page-title text-text">{post.title}</h1>
            {post.publishedAt ? (
              <time className="block text-sm text-text-muted" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
          </Reveal>

          <Reveal delay={0.06} className="mt-12 space-y-6">
            {paragraphs.map((paragraph) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={paragraph} className="text-section-title pt-4 text-text">
                    {paragraph.replace(/^##\s+/, '')}
                  </h2>
                );
              }
              return (
                <p key={paragraph} className="text-lede text-base leading-relaxed text-text-secondary">
                  {paragraph}
                </p>
              );
            })}
          </Reveal>

          <Reveal delay={0.1} className="mt-14">
            <Link href="/blogs" className="text-link-quiet">
              Back to blogs
            </Link>
          </Reveal>
        </Container>
      </main>
    </SiteShell>
  );
}
