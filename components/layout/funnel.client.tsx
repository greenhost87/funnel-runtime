"use client";

import { FormError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FunnelConfigError, FunnelDescription } from "@/components/layout/funnel-tagged";
import { Funnel, FunnelHeader, FunnelLoading } from "@/components/layout/funnel-primitives";
import { FunnelStepProgress } from "@/components/layout/funnel-progress";
import { ResultScreen, ScreenRenderer } from "@/components/layout/screens";
import { useFunnelController } from "@/components/layout/use-funnel-controller";
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
        <h1 className="title is-3 funnel__title">{currentStep.title}</h1>
        {currentStep.description ? (
          <FunnelDescription>{currentStep.description}</FunnelDescription>
        ) : null}
      </FunnelHeader>
      <ScreenRenderer step={currentStep} draftAnswer={draftAnswer} onDraftChange={onDraftChange} />
      {validationError ? <FormError role="alert">{validationError}</FormError> : null}
      <div className="funnel__controls">
        {canGoBack ? (
          <Button
            variant="secondary"
            type="button"
            className="funnel__control-button"
            onClick={onBack}
          >
            Back
          </Button>
        ) : (
          <span className="funnel__control-spacer" aria-hidden="true" />
        )}
        <Button variant="primary" type="button" className="funnel__control-button" onClick={onNext}>
          {isInfo ? "Continue" : "Next"}
        </Button>
      </div>
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
