"use client";

import type { ResultConfig } from "@/system/funnel/config.types";

type Props = {
  result: ResultConfig;
  onCtaClick: () => void;
};

export function ResultScreen({ result, onCtaClick }: Props) {
  return (
    <div className="funnel__result">
      <h2 className="funnel__result-title">{result.title}</h2>
      <p className="funnel__result-body">{result.body}</p>
      <button className="btn btn--primary btn--cta" type="button" onClick={onCtaClick}>
        {result.cta.label}
      </button>
    </div>
  );
}
