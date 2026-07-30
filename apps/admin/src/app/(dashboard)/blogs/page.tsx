'use client';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { BlogManager } from '@/features/blogs/components/blog-manager';

export default function BlogsAdminPage() {
  return (
    <AuthGuard permission="blog.manage">
      <BlogManager />
    </AuthGuard>
  );
}
