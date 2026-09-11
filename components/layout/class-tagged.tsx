import type { ReactNode } from "react";
import { createClassTagged } from "@/components/layout/create-class-tagged";
import type { AdminCardProps } from "@/components/ui/html-props";

const adminCardTagged = createClassTagged("box admin-card", "section");

export function AdminCard(props: AdminCardProps): ReactNode {
  return adminCardTagged(props);
}
