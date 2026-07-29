export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
};

export type UserRole = 'customer' | 'admin' | 'super_admin';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type CmsSeo = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
  keywords?: string[];
};

export type CmsCta = {
  label?: string;
  href?: string;
};

export type CmsSection = {
  id: string;
  code: string;
  label: string;
  isEnabled: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
};

export type CmsPageSnapshot = {
  page: {
    id: string;
    slug: string;
    title: string;
    status: string;
    seo: CmsSeo;
  };
  sections: CmsSection[];
};
