import type { ReactNode } from "react";
import type {
  AdminCardProps,
  AnalyticsCardProps,
  FunnelConfigErrorProps,
  FunnelDescriptionProps,
  LayoutCardSurfaceProps,
} from "@/components/layout/html-props";

type LayoutTagName = "section" | "div" | "p" | "span";

type ClassTaggedProps = {
  as?: LayoutTagName;
  className: string;
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
};

type TaggedLayoutProps = {
  as?: LayoutTagName;
  children: ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  title?: string;
  "aria-label"?: string;
};

interface ConditionalDivProps extends LayoutCardSurfaceProps {
  baseClass: string;
  modifierClass: string;
  enabled?: boolean;
}

interface ConditionalCardProps extends LayoutCardSurfaceProps {
  enabled?: boolean;
}

function ClassTagged(props: ClassTaggedProps): ReactNode {
  const Tag = props.as ?? "div";
  return (
    <Tag
      className={props.className}
      id={props.id}
      role={props.role}
      tabIndex={props.tabIndex}
      title={props.title}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </Tag>
  );
}

function conditionalClassName(base: string, modifier: string, enabled?: boolean): string {
  return [base, enabled ? modifier : ""].filter(Boolean).join(" ");
}

function ConditionalDiv(props: ConditionalDivProps): ReactNode {
  return (
    <div
      className={conditionalClassName(props.baseClass, props.modifierClass, props.enabled)}
      id={props.id}
      role={props.role}
      tabIndex={props.tabIndex}
      onClick={props.onClick}
      onKeyDown={props.onKeyDown}
    >
      {props.children}
    </div>
  );
}

function createClassTagged(className: string, defaultAs: LayoutTagName) {
  return function TaggedLayout(props: TaggedLayoutProps): ReactNode {
    return (
      <ClassTagged
        as={props.as ?? defaultAs}
        className={className}
        id={props.id}
        role={props.role}
        tabIndex={props.tabIndex}
        title={props.title}
        aria-label={props["aria-label"]}
      >
        {props.children}
      </ClassTagged>
    );
  };
}

function createConditionalCard(baseClass: string, modifierClass: string) {
  return function ConditionalCard(props: ConditionalCardProps): ReactNode {
    return <ConditionalDiv baseClass={baseClass} modifierClass={modifierClass} {...props} />;
  };
}

const adminCardTagged = createClassTagged("box admin-card", "section");
const funnelConfigErrorTagged = createClassTagged(
  "notification is-danger funnel__config-error",
  "p",
);
const funnelDescriptionTagged = createClassTagged("funnel__description", "p");
const AnalyticsCardView = createConditionalCard("box analytics-card", "analytics-card--primary");

export function AdminCard(props: AdminCardProps): ReactNode {
  return adminCardTagged(props);
}

export function FunnelConfigError(props: FunnelConfigErrorProps): ReactNode {
  return funnelConfigErrorTagged(props);
}

export function FunnelDescription(props: FunnelDescriptionProps): ReactNode {
  return funnelDescriptionTagged(props);
}

export function AnalyticsCard(props: AnalyticsCardProps): ReactNode {
  return <AnalyticsCardView {...props} enabled={props.primary} />;
}
