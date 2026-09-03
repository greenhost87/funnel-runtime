"use client";

import { FormError } from "@/components/layout/form-error";
import { Funnel } from "@/components/layout/funnel/funnel";
import { FunnelConfigError, FunnelDescription } from "@/components/layout/class-tagged";
import { FunnelHeader } from "@/components/layout/funnel/funnel-header";
import { FunnelLoading } from "@/components/layout/funnel/funnel-loading";
import { FunnelTitle } from "@/components/layout/funnel/funnel-title";
import { FunnelScreenControls } from "@/app/components/funnel/funnel-controls";
import { FunnelStepProgress } from "@/app/components/funnel/funnel-progress";
import { ResultScreen } from "@/app/components/funnel/result-screen";
import { ScreenRenderer } from "@/app/components/funnel/screen-renderer";
import { useFunnelController } from "@/app/components/funnel/use-funnel-controller";
import type { FunnelStep, FunnelSessionState, StepAnswer } from "@/system/funnel/config.types";
import type { FunnelApiState } from "@/system/funnel/api-response.schema";

function funnelStepIsInfo(step: FunnelStep): boolean {
  return step.type === "info";
}

function funnelCanGoBack(state: FunnelSessionState): boolean {
  return state.history.length > 1;
}

type FunnelResultViewProps = {
  data: FunnelApiState;
  onCtaClick: () => void;
};

function FunnelResultView({ data, onCtaClick }: FunnelResultViewProps) {
  if (!data.result) {
    return <FunnelConfigError>Result is not available.</FunnelConfigError>;
  }
  return (
    <Funnel>
      <FunnelStepProgress {...data.state.progress} />
      <ResultScreen result={data.result} onCtaClick={onCtaClick} />
    </Funnel>
  );
}

type FunnelStepViewProps = {
  data: FunnelApiState;
  currentStep: FunnelStep;
  draftAnswer: StepAnswer | null;
  validationError: string | null;
  onDraftChange: (value: StepAnswer | null) => void;
  onBack: () => void;
  onNext: () => void;
};

function FunnelStepView({
  data,
  currentStep,
  draftAnswer,
  validationError,
  onDraftChange,
  onBack,
  onNext,
}: FunnelStepViewProps) {
  const isInfo = funnelStepIsInfo(currentStep);
  const canGoBack = funnelCanGoBack(data.state);

  return (
    <Funnel>
      <FunnelStepProgress {...data.state.progress} />
      <FunnelHeader>
        <FunnelTitle>{currentStep.title}</FunnelTitle>
        {currentStep.description ? (
          <FunnelDescription>{currentStep.description}</FunnelDescription>
        ) : null}
      </FunnelHeader>
      <ScreenRenderer
        step={currentStep}
        draftAnswer={draftAnswer}
        onDraftChange={onDraftChange}
      />
      {validationError ? <FormError role="alert">{validationError}</FormError> : null}
      <FunnelScreenControls
        showBack={canGoBack}
        nextLabel={isInfo ? "Continue" : "Next"}
        onBack={onBack}
        onNext={onNext}
      />
    </Funnel>
  );
}

type FunnelController = ReturnType<typeof useFunnelController>;

function renderActiveFunnel(controller: FunnelController) {
  const { data, currentStep } = controller;
  if (!data) {
    return <FunnelConfigError>Unable to load funnel</FunnelConfigError>;
  }
  if (data.state.isResult) {
    return <FunnelResultView data={data} onCtaClick={() => void controller.clickCta()} />;
  }
  if (!currentStep) {
    return <FunnelConfigError>Current step is not available.</FunnelConfigError>;
  }
  return (
    <FunnelStepView
      data={data}
      currentStep={currentStep}
      draftAnswer={controller.draftAnswer}
      validationError={controller.validationError}
      onDraftChange={controller.setDraftAnswer}
      onBack={() => void controller.goBack()}
      onNext={() =>
        void (funnelStepIsInfo(currentStep)
          ? controller.advanceInfoStep()
          : controller.submitCurrentAnswer())
      }
    />
  );
}

export function FunnelClient({ initialQuery = "" }: { initialQuery?: string }) {
  const controller = useFunnelController(initialQuery);

  if (controller.loading) {
    return <FunnelLoading>Loading funnel…</FunnelLoading>;
  }

  if (controller.error) {
    return <FunnelConfigError>{controller.error}</FunnelConfigError>;
  }

  return renderActiveFunnel(controller);
}
