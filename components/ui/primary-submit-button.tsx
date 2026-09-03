import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type PrimarySubmitButtonProps = {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimarySubmitButton({
  children,
  loading = false,
  loadingLabel,
}: PrimarySubmitButtonProps) {
  return (
    <Button variant="primary" type="submit" disabled={loading}>
      {loading && loadingLabel ? loadingLabel : children}
    </Button>
  );
}
