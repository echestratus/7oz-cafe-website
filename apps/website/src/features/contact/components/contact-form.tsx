'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { authFieldClassName } from '@/features/auth/lib/form-styles';
import { ApiClientError } from '@/lib/api-client';
import { submitContactMessage } from '@/services/contact';

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name.').max(120, 'Name is too long.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(40, 'Phone number is too long.').optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please write a short message (at least 10 characters).')
    .max(5000, 'Message is too long.'),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: '', email: '', phone: '', message: '' },
  });

  async function onSubmit(values: ContactValues) {
    setFormError(null);
    try {
      await submitContactMessage({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone?.trim() || undefined,
        message: values.message,
      });
      setSubmitted(true);
      reset();
    } catch (error) {
      setFormError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to send your message. Please try again.',
      );
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10">
        <p className="text-eyebrow">Message sent</p>
        <h2 className="text-section-title text-text">Thank you</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          We received your note and will get back to you soon.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSubmitted(false);
            setFormError(null);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-media bg-surface-secondary/90 p-8 md:p-10"
      noValidate
    >
      <div className="space-y-3">
        <h2 className="text-section-title text-text">Send a message</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Questions about the cafe, private gatherings, or anything else — write to us here.
        </p>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="text-text">Full name</span>
        <input
          type="text"
          autoComplete="name"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
        {errors.fullName ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-text">Email</span>
        <input
          type="email"
          autoComplete="email"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-text">
          Phone <span className="text-text-muted">(optional)</span>
        </span>
        <input
          type="tel"
          autoComplete="tel"
          className={authFieldClassName}
          aria-invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
        {errors.phone ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.phone.message}
          </p>
        ) : null}
      </label>

      <label className="block space-y-2 text-sm">
        <span className="text-text">Message</span>
        <textarea
          rows={5}
          className={authFieldClassName}
          aria-invalid={Boolean(errors.message)}
          {...register('message')}
        />
        {errors.message ? (
          <p className="text-sm text-red-700" role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </label>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
