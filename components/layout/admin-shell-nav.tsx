"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  AnalyticsIcon,
  LogoutIcon,
  TrafficIcon,
  VersionsIcon,
} from "@/components/ui/admin-nav-icons";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { adminLogoutAction } from "@/app/actions/admin";

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
  const router = useRouter();
  const mobileLayout = useMobileNavLayout();
  const [collapsed, setCollapsed] = useState(false);
  const expanded = !collapsed;

  useEffect(() => {
    if (mobileLayout) {
      setCollapsed(true);
    }
  }, [mobileLayout]);

  async function logout() {
    await adminLogoutAction();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav
      className={["admin-nav", collapsed ? "admin-nav--collapsed" : ""].filter(Boolean).join(" ")}
      aria-label="Admin navigation"
    >
      <Button
        variant="nav"
        type="button"
        className="admin-nav__link admin-nav__toggle"
        onClick={() => {
          setCollapsed((value) => !value);
        }}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
      >
        <svg
          className="admin-nav__toggle-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {expanded ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
        </svg>
      </Button>

      <div className="admin-nav__items">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="admin-nav__link"
            aria-current={
              pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="admin-nav__icon">{item.icon}</span>
            <span className="admin-nav__label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="admin-nav__footer">
        <ThemeToggle collapsed={collapsed} className="admin-nav__theme" />
        <Button
          variant="nav"
          type="button"
          className="admin-nav__link admin-nav__link--logout"
          onClick={() => void logout()}
          title="Logout"
        >
          <span className="admin-nav__icon">
            <LogoutIcon />
          </span>
          <span className="admin-nav__label">Logout</span>
        </Button>
      </div>
    </nav>
  );
}
