import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'onDark' | 'inverse';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className'> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, 'children' | 'className'> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-inverse hover:bg-primary-hover focus-visible:outline-primary',
  secondary:
    'bg-accent text-inverse hover:bg-accent/90 focus-visible:outline-accent',
  outline:
    'border border-border bg-transparent text-text hover:bg-surface-secondary focus-visible:outline-primary',
  ghost:
    'border border-transparent bg-transparent text-text hover:bg-surface-secondary focus-visible:outline-primary',
  onDark:
    'border border-white/55 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white',
  inverse:
    'bg-white text-primary hover:bg-white/90 focus-visible:outline-white',
};

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', className, children, ...rest } = props;
  const classes = cx(
    'inline-flex min-h-12 items-center justify-center rounded-full px-8 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    className,
  );

  if ('href' in rest && rest.href) {
    const { href, ...linkRest } = rest;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as ButtonAsButton;
  return (
    <button type={buttonRest.type ?? 'button'} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
