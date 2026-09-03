import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type SecondaryActionButtonProps = {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  loadingLabel?: string;
};

export function SecondaryActionButton({
  children,
  onClick,
  loading = false,
  loadingLabel,
}: SecondaryActionButtonProps) {
  return (
    <Button variant="secondary" type="button" disabled={loading} onClick={onClick}>
      {loading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
