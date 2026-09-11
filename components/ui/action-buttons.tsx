import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type PrimarySubmitButtonProps = {
  children: ReactNode;
  disabled?: boolean;
};

export function PrimarySubmitButton({ children, disabled }: PrimarySubmitButtonProps) {
  return (
    <Button variant="primary" type="submit" disabled={disabled}>
      {children}
    </Button>
  );
}
