import type { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cx('mx-auto w-full max-w-[1280px] px-6 md:px-8', className)}>{children}</div>
  );
}
