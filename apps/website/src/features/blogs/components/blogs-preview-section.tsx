import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { BlogPostCard } from '@/features/blogs/components/blog-post-card';
import { asString } from '@/services/cms';
import type { BlogPost } from '@/services/blog';

interface BlogsPreviewSectionProps {
  data: Record<string, unknown>;
  posts: BlogPost[];
}

export function BlogsPreviewSection({ data, posts }: BlogsPreviewSectionProps) {
  const heading = asString(data.heading, 'News & Events');
  const description = asString(
    data.description,
    'Stories from the cafe — openings, visits, and moments worth sharing.',
  );
  const limit = typeof data.limit === 'number' ? Math.min(data.limit, 6) : 3;
  const items = posts.slice(0, limit);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="section-pad bg-transparent">
      <Container>
        <Reveal className="mb-14">
          <SectionIntro eyebrow="Blogs" title={heading} description={description} />
        </Reveal>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {items.map((post, index) => (
            <BlogPostCard key={post.id} post={post} delay={index * 0.06} />
          ))}
        </div>

        <Reveal className="mt-14">
          <Link href="/blogs" className="text-link-quiet inline-flex items-center gap-2">
            View all stories
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
