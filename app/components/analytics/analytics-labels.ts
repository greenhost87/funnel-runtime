import type { AnalyticsLabels, StepFunnelMetric } from "@/system/analytics/analytics.service";

export function resolveVersionLabel(versionId: string, labels: AnalyticsLabels): string {
  return labels.versions[versionId] ?? versionId;
}

export function resolveStepLabel(
  versionId: string,
  stepId: string,
  labels: AnalyticsLabels,
): string {
  return labels.steps[`${versionId}:${stepId}`] ?? stepId;
}

const AXIS_LABEL_MAX = 56;
const VERSION_AXIS_MAX = 20;
const STEP_AXIS_MAX = 40;

export type StepFunnelLabelContext = {
  showVariant: boolean;
  showVersion: boolean;
  duplicateStepTitles: ReadonlySet<string>;
};

function truncateLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

export function buildStepFunnelLabelContext(
  data: StepFunnelMetric[],
  labels: AnalyticsLabels,
): StepFunnelLabelContext {
  const stepTitleCounts = new Map<string, number>();
  for (const row of data) {
    const stepTitle = resolveStepLabel(row.versionId, row.stepId, labels);
    stepTitleCounts.set(stepTitle, (stepTitleCounts.get(stepTitle) ?? 0) + 1);
  }

  const duplicateStepTitles = new Set<string>();
  for (const [stepTitle, count] of stepTitleCounts) {
    if (count > 1) {
      duplicateStepTitles.add(stepTitle);
    }
  }

  return {
    showVariant: new Set(data.map((row) => row.variant)).size > 1,
    showVersion: new Set(data.map((row) => row.versionId)).size > 1,
    duplicateStepTitles,
  };
}

export function formatStepFunnelFullLabel(
  row: { versionId: string; variant: string; stepId: string },
  labels: AnalyticsLabels,
): string {
  const versionName = resolveVersionLabel(row.versionId, labels);
  const stepName = resolveStepLabel(row.versionId, row.stepId, labels);
  return `${row.variant} · ${versionName}: ${stepName}`;
}

export function formatStepFunnelAxisLabel(
  row: { versionId: string; variant: string; stepId: string },
  labels: AnalyticsLabels,
  context: StepFunnelLabelContext,
): string {
  const stepName = resolveStepLabel(row.versionId, row.stepId, labels);
  const needsVariant = context.showVariant || context.duplicateStepTitles.has(stepName);
  const needsVersion = context.showVersion;

  if (!needsVariant && !needsVersion) {
    return truncateLabel(stepName, AXIS_LABEL_MAX);
  }

  const parts: string[] = [];
  if (needsVariant) {
    parts.push(row.variant);
  }
  if (needsVersion) {
    parts.push(truncateLabel(resolveVersionLabel(row.versionId, labels), VERSION_AXIS_MAX));
  }
  parts.push(truncateLabel(stepName, STEP_AXIS_MAX));
  return truncateLabel(parts.join(" · "), AXIS_LABEL_MAX);
}

export function formatVariantComparisonLabel(
  row: { versionId: string; variant: string },
  labels: AnalyticsLabels,
): string {
  const versionName = resolveVersionLabel(row.versionId, labels);
  return `${row.variant} · ${versionName}`;
}
