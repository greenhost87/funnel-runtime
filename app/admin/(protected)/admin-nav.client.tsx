"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  AnalyticsIcon,
  LogoutIcon,
  TrafficIcon,
  VersionsIcon,
} from "@/components/ui/admin-nav-icons";
import { AdminNavLogoutButton } from "@/components/ui/admin-nav-logout-button";
import { AdminNavToggleButton } from "@/components/ui/admin-nav-toggle-button";
import { AdminNavThemeToggle } from "@/components/ui/admin-nav-theme-toggle";
import { AdminNav as AdminNavRoot } from "@/components/layout/admin/admin-nav";
import { AdminNavFooter } from "@/components/layout/admin/admin-nav-footer";
import { AdminNavIcon } from "@/components/layout/admin/admin-nav-icon";
import { AdminNavItems } from "@/components/layout/admin/admin-nav-items";
import { AdminNavLabel } from "@/components/layout/admin/admin-nav-label";
import { AdminNavLink } from "@/components/layout/admin/admin-nav-link";

const MOBILE_NAV_QUERY = "(max-width: 479px)";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/admin/versions", label: "Versions", icon: <VersionsIcon /> },
  { href: "/admin/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { href: "/admin/traffic", label: "Traffic", icon: <TrafficIcon /> },
];

function AdminLogoutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <AdminNavLogoutButton onClick={() => void logout()} title={collapsed ? "Logout" : undefined}>
      <AdminNavIcon>
        <LogoutIcon />
      </AdminNavIcon>
      <AdminNavLabel>Logout</AdminNavLabel>
    </AdminNavLogoutButton>
  );
}

function useMobileNavLayout() {
  const [mobileLayout, setMobileLayout] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAV_QUERY);
    const sync = () => {
      setMobileLayout(mediaQuery.matches);
    };
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, []);

  return mobileLayout;
}

export function AdminShellNav() {
  const pathname = usePathname();
  const mobileLayout = useMobileNavLayout();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (mobileLayout) {
      setCollapsed(true);
    }
  }, [mobileLayout]);

  return (
    <AdminNavRoot collapsed={collapsed} aria-label="Admin navigation">
      <AdminNavToggleButton
        collapsed={collapsed}
        onClick={() => {
          setCollapsed((value) => !value);
        }}
      />

      <AdminNavItems>
        {navItems.map((item) => (
          <AdminNavLink
            key={item.href}
            href={item.href}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            title={collapsed ? item.label : undefined}
          >
            <AdminNavIcon>{item.icon}</AdminNavIcon>
            <AdminNavLabel>{item.label}</AdminNavLabel>
          </AdminNavLink>
        ))}
      </AdminNavItems>

      <AdminNavFooter>
        <AdminNavThemeToggle collapsed={collapsed} />
        <AdminLogoutButton collapsed={collapsed} />
      </AdminNavFooter>
    </AdminNavRoot>
  );
}
