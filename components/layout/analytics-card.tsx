import type { ReactNode } from "react";
import type { AnalyticsCardProps, LayoutCardSurfaceProps } from "@/components/ui/html-props";

interface ConditionalDivProps extends LayoutCardSurfaceProps {
  baseClass: string;
  modifierClass: string;
  enabled?: boolean;
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

export function AnalyticsCard(props: AnalyticsCardProps): ReactNode {
  return (
    <ConditionalDiv
      {...props}
      baseClass="box analytics-card"
      modifierClass="analytics-card--primary"
      enabled={props.primary}
    />
  );
}
