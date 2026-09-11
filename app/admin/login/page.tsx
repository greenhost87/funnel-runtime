"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { adminLoginAction } from "@/app/actions/admin";
import { PrimarySubmitButton } from "@/components/ui/action-buttons";
import { AdminCardTitle, FormError, TextField } from "@/components/ui/form";
import { AdminLogin, PageShell } from "@/components/layout/primitives";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await adminLoginAction(password);
    setLoading(false);
    if (!result.ok) {
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
          <TextField
            id="password"
            label="Password"
            variant="form"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            autoComplete="current-password"
            required
          />
          {error ? <FormError>{error}</FormError> : null}
          <PrimarySubmitButton disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </PrimarySubmitButton>
        </form>
      </AdminLogin>
    </PageShell>
  );
}
