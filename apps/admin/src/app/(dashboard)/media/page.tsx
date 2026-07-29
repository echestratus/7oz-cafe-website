'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { MediaLibrary } from '@/features/media/components/media-library';

export default function MediaPage() {
  return (
    <AuthGuard permission="cms.manage">
      <MediaLibrary />
    </AuthGuard>
  );
}
