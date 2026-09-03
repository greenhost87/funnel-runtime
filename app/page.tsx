import { FunnelClient } from "@/app/components/funnel/funnel.client";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(params: SearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      search.set(key, value);
    }
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  return (
    <main className="page-shell">
      <div className="page-content">
        <FunnelClient initialQuery={toQueryString(resolvedParams)} />
      </div>
    </main>
  );
}
