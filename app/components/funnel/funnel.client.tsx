"use client";

import { FunnelControls } from "@/app/components/funnel/funnel-controls";
import { FunnelProgress } from "@/app/components/funnel/funnel-progress";
import { ResultScreen } from "@/app/components/funnel/result-screen";
import { ScreenRenderer } from "@/app/components/funnel/screen-renderer";
import { useFunnelController } from "@/app/components/funnel/use-funnel-controller";

export function FunnelClient({ initialQuery = "" }: { initialQuery?: string }) {
  const controller = useFunnelController(initialQuery);

  if (controller.loading) {
    return <p className="funnel__loading">Loading funnel…</p>;
  }

  if (controller.error || !controller.data) {
    return <p className="funnel__config-error">{controller.error ?? "Unable to load funnel"}</p>;
  }

  const { data, currentStep } = controller;

  if (data.state.isResult && data.result) {
    return (
      <div className="funnel">
        <FunnelProgress {...data.state.progress} />
        <ResultScreen result={data.result} onCtaClick={() => void controller.clickCta()} />
      </div>
    );
  }

  if (!currentStep) {
    return <p className="funnel__config-error">Current step is not available.</p>;
  }

  const isInfo = currentStep.type === "info";
  const canGoBack = data.state.history.length > 1;

  return (
    <div className="funnel">
      <FunnelProgress {...data.state.progress} />
      <div className="funnel__header">
        <h1 className="funnel__title">{currentStep.title}</h1>
        {currentStep.description ? (
          <p className="funnel__description">{currentStep.description}</p>
        ) : null}
      </div>
      <ScreenRenderer
        step={currentStep}
        draftAnswer={controller.draftAnswer}
        onDraftChange={controller.setDraftAnswer}
      />
      {controller.validationError ? (
        <p className="form-error" role="alert">
          {controller.validationError}
        </p>
      ) : null}
      <FunnelControls
        showBack={canGoBack}
        showNext
        nextLabel={isInfo ? "Continue" : "Next"}
        onBack={() => void controller.goBack()}
        onNext={() =>
          void (isInfo ? controller.advanceInfoStep() : controller.submitCurrentAnswer())
        }
      />
    </div>
  );
}
