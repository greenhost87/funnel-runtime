"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { PrimarySubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminCardTitle,
  AdminLogin,
  FormError,
  FormField,
  PageShell,
} from "@/components/layout/primitives";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      setError("Invalid credentials");
      return;
    }
    router.push("/admin/versions");
    router.refresh();
  }

  return (
    <PageShell>
      <AdminLogin>
        <AdminCardTitle>Admin login</AdminCardTitle>
        <form
          onSubmit={(event) => {
            void onSubmit(event);
          }}
        >
          <FormField>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              variant="form"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              autoComplete="current-password"
              required
            />
          </FormField>
          {error ? <FormError>{error}</FormError> : null}
          <PrimarySubmitButton loading={loading} loadingLabel="Signing in…">
            Sign in
          </PrimarySubmitButton>
        </form>
      </AdminLogin>
    </PageShell>
  );
}
