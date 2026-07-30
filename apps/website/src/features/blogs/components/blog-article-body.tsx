type ArticleBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'divider' };

function parseArticleBody(body: string): ArticleBlock[] {
  const normalized = body.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (/^---+$/.test(chunk)) {
        return { type: 'divider' } as const;
      }
      if (/^##\s+/.test(chunk)) {
        return {
          type: 'heading',
          text: chunk.replace(/^##\s+/, '').trim(),
        } as const;
      }
      return {
        type: 'paragraph',
        text: chunk.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim(),
      } as const;
    });
}

function normalizeComparable(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface BlogArticleBodyProps {
  body: string;
  excerpt?: string;
}

export function BlogArticleBody({ body, excerpt }: BlogArticleBodyProps) {
  const blocks = parseArticleBody(body);
  const firstParagraph = blocks.find((block) => block.type === 'paragraph');
  const hasSections = blocks.some((block) => block.type === 'heading');
  const excerptText = excerpt?.trim() ?? '';
  const excerptMatchesLead =
    excerptText.length > 0 &&
    firstParagraph?.type === 'paragraph' &&
    normalizeComparable(excerptText) === normalizeComparable(firstParagraph.text);

  const showExcerptLede = Boolean(excerptText) && hasSections && !excerptMatchesLead;

  let paragraphIndex = 0;

  return (
    <div className="prose-blog mx-auto max-w-[40rem]">
      {showExcerptLede ? <p className="prose-blog-lede">{excerptText}</p> : null}

      <div className={showExcerptLede ? 'prose-blog-body' : 'prose-blog-body prose-blog-body-flush'}>
        {blocks.map((block, index) => {
          if (block.type === 'divider') {
            return <hr key={`divider-${index}`} className="prose-blog-rule" />;
          }

          if (block.type === 'heading') {
            return (
              <h2 key={`heading-${index}`} className="prose-blog-heading">
                {block.text}
              </h2>
            );
          }

          const isLead = !showExcerptLede && paragraphIndex === 0;
          paragraphIndex += 1;

          return (
            <p
              key={`paragraph-${index}`}
              className={isLead ? 'prose-blog-lede' : 'prose-blog-paragraph'}
            >
              {block.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
