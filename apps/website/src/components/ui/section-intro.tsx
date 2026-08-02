import type { ReactNode } from 'react';

interface SectionIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  titleAs?: 'h1' | 'h2';
  /** Use 'dark' when the section sits on a dark background. */
  tone?: 'light' | 'dark';
  className?: string;
  children?: ReactNode;
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  titleAs = 'h2',
  tone = 'light',
  className,
  children,
}: SectionIntroProps) {
  const TitleTag = titleAs;
  const isDark = tone === 'dark';
  const titleSize = titleAs === 'h1' ? 'text-page-title' : 'text-section-title';

  return (
    <div
      className={cx(
        'max-w-2xl space-y-5',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className={cx('text-eyebrow', isDark && 'text-eyebrow-dark')}>{eyebrow}</p>
      ) : null}
      <TitleTag className={cx(titleSize, isDark ? 'text-white' : 'text-text')}>
        {title}
      </TitleTag>
      {description ? (
        <p className={cx('text-lede', isDark && 'text-lede-dark')}>{description}</p>
      ) : null}
      {children}
    </div>
  );
}
