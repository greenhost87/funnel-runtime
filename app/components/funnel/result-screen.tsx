"use client";

import { Button } from "@/components/ui/button";
import { FunnelResult } from "@/components/layout/funnel/funnel-result";
import { FunnelResultBody } from "@/components/layout/funnel/funnel-result-body";
import { FunnelResultTitle } from "@/components/layout/funnel/funnel-result-title";
import type { ResultConfig } from "@/system/funnel/config.types";

type Props = {
  result: ResultConfig;
  onCtaClick: () => void;
};

export function ResultScreen({ result, onCtaClick }: Props) {
  return (
    <FunnelResult>
      <FunnelResultTitle>{result.title}</FunnelResultTitle>
      <FunnelResultBody>{result.body}</FunnelResultBody>
      <Button variant="primary" cta type="button" onClick={onCtaClick}>
        {result.cta.label}
      </Button>
    </FunnelResult>
  );
}
