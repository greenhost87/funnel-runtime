import Script from "next/script";
import { withBasePath } from "@/system/config/base-path";

const BULMA_CALENDAR_SCRIPT = withBasePath("/vendor/bulma-calendar.min.js");

const BULMA_DATE_BRIDGE_SCRIPT = `(function attachBulmaDateBridge(global) {
  function attachBulmaDate(input, options, initial, onSelect) {
    const runtime = global.bulmaCalendar;
    if (!runtime || typeof runtime.attach !== "function") {
      throw new Error("bulma-calendar-js is unavailable");
    }

    const instances = runtime.attach(input, options);
    const instance = instances[0];
    if (!instance) {
      throw new Error("Failed to attach bulma calendar");
    }

    if (initial) {
      instance.value(initial);
      instance.save();
    }

    if (typeof onSelect === "function") {
      instance.on("select", function onBulmaDateSelect() {
        instance.save();
        onSelect(instance.value());
      });
    }

    return instance;
  }

  global.attachBulmaDate = attachBulmaDate;
})(globalThis);`;

export function BulmaCalendarScripts() {
  return (
    <>
      <Script src={BULMA_CALENDAR_SCRIPT} strategy="afterInteractive" />
      <Script
        id="bulma-date-bridge"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: BULMA_DATE_BRIDGE_SCRIPT }}
      />
    </>
  );
}
