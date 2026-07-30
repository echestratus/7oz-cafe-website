'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpenText,
  CalendarDays,
  FileImage,
  Gift,
  Inbox,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react';

import { logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reservations', label: 'Reservations', icon: CalendarDays, permission: 'reservation.manage' },
  { href: '/customers', label: 'Customers', icon: Users, permission: 'customer.read' },
  { href: '/contact-messages', label: 'Contact', icon: Inbox, permission: 'contact.manage' },
  { href: '/membership', label: 'Membership', icon: Sparkles, permission: 'membership.manage' },
  { href: '/loyalty', label: 'Loyalty', icon: Gift, permission: 'loyalty.manage' },
  { href: '/blogs', label: 'Blogs', icon: BookOpenText, permission: 'blog.manage' },
  { href: '/cms', label: 'CMS', icon: Newspaper, permission: 'cms.manage' },
  { href: '/media', label: 'Media', icon: FileImage, permission: 'cms.manage' },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function onLogout() {
    try {
      await logout();
    } catch {
      // Clear local session even if API logout fails.
    }
    clearSession();
    router.replace('/login');
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <Image
          src="/assets/logo/logo-7-oz-espresso-scaled.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <div>
          <p className="font-heading text-xl text-text">7Oz Admin</p>
          <p className="text-xs text-text-secondary">Operations</p>
        </div>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          if ('permission' in link && link.permission && !hasPermission(link.permission)) {
            return null;
          }

          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="truncate text-sm font-medium text-text">{user?.fullName}</p>
        <p className="truncate text-xs text-text-secondary">{user?.email}</p>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
