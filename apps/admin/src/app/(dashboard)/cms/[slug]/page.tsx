'use client';

import { use } from 'react';

import { AuthGuard } from '@/features/auth/components/auth-guard';
import { CmsEditor } from '@/features/cms/components/cms-editor';

interface CmsPageProps {
  params: Promise<{ slug: string }>;
}

export default function CmsPageDetail({ params }: CmsPageProps) {
  const { slug } = use(params);

  return (
    <AuthGuard permission="cms.manage">
      <CmsEditor slug={slug} />
    </AuthGuard>
  );
}
