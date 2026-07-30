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
      <article className="group space-y-4 border-t border-border pt-6">
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
      </article>
    </Reveal>
  );
}
