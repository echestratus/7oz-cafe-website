'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { GalleryManager } from '@/features/gallery/components/gallery-manager';

export default function GalleryAdminPage() {
  return (
    <AuthGuard permission="gallery.manage">
      <GalleryManager />
    </AuthGuard>
  );
}
