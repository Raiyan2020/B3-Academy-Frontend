'use client';

import { DoctorRoleGate } from '@/features/admin/components/doctor-role-gate';
import { DoctorShell } from '@/features/admin/components/doctor-shell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DoctorRoleGate>
      <DoctorShell>{children}</DoctorShell>
    </DoctorRoleGate>
  );
}
