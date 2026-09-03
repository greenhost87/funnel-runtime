import { AdminValidationErrors } from "@/components/layout/admin/admin-validation-errors";

type AdminErrorListProps = {
  errors: readonly string[];
};

export function AdminErrorList({ errors }: AdminErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <AdminValidationErrors>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </AdminValidationErrors>
  );
}
