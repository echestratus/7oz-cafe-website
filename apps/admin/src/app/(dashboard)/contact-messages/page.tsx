'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { ContactMessagesManager } from '@/features/contact-messages/components/contact-messages-manager';

export default function ContactMessagesPage() {
  return (
    <AuthGuard permission="contact.manage">
      <ContactMessagesManager />
    </AuthGuard>
  );
}
