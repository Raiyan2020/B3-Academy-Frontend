'use client';

import { AdminRoleGate } from '@/features/admin/components/admin-role-gate';
import { AdminShell } from '@/features/admin/components/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoleGate>
      <AdminShell>{children}</AdminShell>
    </AdminRoleGate>
  );
}
