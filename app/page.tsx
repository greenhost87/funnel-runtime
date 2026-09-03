import { FunnelClient } from "@/app/components/funnel/funnel.client";
import { PageContent } from "@/components/layout/page-content";
import { PageShell } from "@/components/layout/page-shell";

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
  return (
    <PageShell>
      <PageContent>
        <FunnelClient initialQuery={toQueryString(await searchParams)} />
      </PageContent>
    </PageShell>
  );
}
