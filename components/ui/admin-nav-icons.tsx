import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

type AdminNavStrokeIconProps = {
  className?: string;
  children: ReactNode;
};

function AdminNavStrokeIcon({ className, children }: AdminNavStrokeIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {children}
    </svg>
  );
}

type AdminNavIconProps = {
  className?: string;
  paths: readonly string[];
};

function AdminNavIcon({ className, paths }: AdminNavIconProps) {
  return (
    <AdminNavStrokeIcon className={className}>
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </AdminNavStrokeIcon>
  );
}

export function VersionsIcon({ className }: IconProps) {
  return AdminNavIcon({
    className,
    paths: ["M12 2 2 7l10 5 10-5-10-5Z", "m2 17 10 5 10-5", "m2 12 10 5 10-5"],
  });
}

export function AnalyticsIcon({ className }: IconProps) {
  return AdminNavIcon({
    className,
    paths: ["M3 3v18h18", "M7 16V9", "M12 16V5", "M17 16v-7"],
  });
}

export function TrafficIcon({ className }: IconProps) {
  return AdminNavIcon({ className, paths: ["M22 12h-4l-3 9L9 3l-3 9H2"] });
}

export function LogoutIcon({ className }: IconProps) {
  return AdminNavIcon({
    className,
    paths: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  });
}

type CollapseIconProps = {
  className?: string;
  collapsed: boolean;
};

export function CollapseIcon({ collapsed, className }: CollapseIconProps) {
  return (
    <AdminNavStrokeIcon className={className}>
      {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
    </AdminNavStrokeIcon>
  );
}
