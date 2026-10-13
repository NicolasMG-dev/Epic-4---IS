"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SessionGate } from "@/modules/auth";
import { EventsAppShell } from "@/modules/events";
import { RecruitersAppShell } from "@/modules/recruiters";
import { AppShell } from "@/shared/components/layout";
import { isStandaloneEpic4 } from "@/shared/config/standalone.config";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEvents = pathname === "/events" || pathname?.startsWith("/events/");
  const isRecruiters = pathname === "/recruiters" || pathname?.startsWith("/recruiters/");
  if (isRecruiters) {
    const shell = <RecruitersAppShell>{children}</RecruitersAppShell>;
    // Despliegue solo de Epic 4: las rutas de reclutadores no piden sesión.
    return isStandaloneEpic4() ? shell : <SessionGate>{shell}</SessionGate>;
  }
  return <SessionGate>{isEvents ? <EventsAppShell>{children}</EventsAppShell> : <AppShell>{children}</AppShell>}</SessionGate>;
}
