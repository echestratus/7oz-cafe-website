import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/ui/reveal';
import type { BlogPost } from '@/services/blog';

interface BlogPostCardProps {
  post: BlogPost;
  delay?: number;
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function BlogPostCard({ post, delay = 0 }: BlogPostCardProps) {
  return (
    <Reveal delay={delay}>
      <article className="group space-y-5">
        {post.coverUrl ? (
          <Link
            href={`/blogs/${post.slug}`}
            className="relative block aspect-[16/10] overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Image
              src={post.coverUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </Link>
        ) : (
          <div className="border-t border-border pt-6" aria-hidden="true" />
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-eyebrow">{post.kind === 'event' ? 'Event' : 'News'}</p>
            {post.publishedAt ? (
              <time className="text-sm text-text-muted" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
          </div>
          <h3 className="text-card-title text-text transition-colors duration-200 group-hover:text-primary">
            <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="text-lede text-base line-clamp-3">{post.excerpt}</p>
          <Link href={`/blogs/${post.slug}`} className="text-link-quiet inline-flex">
            Read more
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
