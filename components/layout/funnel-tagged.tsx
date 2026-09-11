import type { ReactNode } from "react";
import { createClassTagged } from "@/components/layout/create-class-tagged";
import type { FunnelConfigErrorProps, FunnelDescriptionProps } from "@/components/ui/html-props";

const funnelConfigErrorTagged = createClassTagged(
  "notification is-danger funnel__config-error",
  "p",
);
const funnelDescriptionTagged = createClassTagged("funnel__description", "p");

export function FunnelConfigError(props: FunnelConfigErrorProps): ReactNode {
  return funnelConfigErrorTagged(props);
}

export function FunnelDescription(props: FunnelDescriptionProps): ReactNode {
  return funnelDescriptionTagged(props);
}
