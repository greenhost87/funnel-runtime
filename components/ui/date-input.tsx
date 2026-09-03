"use client";

import { useEffect, useRef, useState } from "react";
import * as v from "valibot";
import { BulmaCalendarScripts } from "@/components/ui/bulma-calendar-scripts";

const BULMA_CALENDAR_UNAVAILABLE = "bulma-calendar-js is unavailable";
const ISO_DATE_FORMAT = "yyyy-MM-dd";
const CALENDAR_WAIT_MS = 10_000;
const CALENDAR_POLL_MS = 25;

const CALENDAR_OPTIONS = {
  type: "date" as const,
  dateFormat: ISO_DATE_FORMAT,
  displayMode: "default" as const,
  lang: "en-US",
  weekStart: 1,
  showHeader: false,
  showClearButton: true,
  closeOnSelect: true,
};

const BulmaCalendarValueSchema = v.object({
  startDate: v.date(),
  endDate: v.optional(v.date()),
});

const BulmaDateAttachSchema = v.function();
const BulmaCalendarRuntimeSchema = v.function();

type DateInputProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
  "aria-label"?: string;
};

let calendarScriptsReady: Promise<void> | undefined;
let calendarScriptsRequested = false;

function markCalendarScriptsRequested(): boolean {
  if (calendarScriptsRequested) {
    return false;
  }
  calendarScriptsRequested = true;
  return true;
}

function toIsoDateString(date: Date | undefined): string {
  if (!date) {
    return "";
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readBulmaDateAttach(): v.InferOutput<typeof BulmaDateAttachSchema> {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "attachBulmaDate");
  return v.parse(BulmaDateAttachSchema, descriptor?.value);
}

function isBulmaDateBridgeReady(): boolean {
  const attachDescriptor = Object.getOwnPropertyDescriptor(globalThis, "attachBulmaDate");
  const runtimeDescriptor = Object.getOwnPropertyDescriptor(globalThis, "bulmaCalendar");
  return (
    v.safeParse(BulmaDateAttachSchema, attachDescriptor?.value).success &&
    v.safeParse(BulmaCalendarRuntimeSchema, runtimeDescriptor?.value).success
  );
}

async function pollBulmaDateBridge(): Promise<void> {
  const deadline = Date.now() + CALENDAR_WAIT_MS;

  while (Date.now() < deadline) {
    if (isBulmaDateBridgeReady()) {
      return;
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, CALENDAR_POLL_MS);
    });
  }

  throw new Error(BULMA_CALENDAR_UNAVAILABLE);
}

async function waitForBulmaDateBridge(): Promise<void> {
  calendarScriptsReady ??= pollBulmaDateBridge();
  return calendarScriptsReady;
}

function readSelectedDate(rawValue: object): string {
  const selected = v.parse(BulmaCalendarValueSchema, rawValue);
  return toIsoDateString(selected.startDate);
}

function attachDateCalendar(
  input: HTMLInputElement,
  initial: string,
  onSelect: (value: string) => void,
): void {
  const attachFn = readBulmaDateAttach();
  Reflect.apply(attachFn, globalThis, [
    input,
    CALENDAR_OPTIONS,
    initial,
    (rawValue: object) => {
      onSelect(readSelectedDate(rawValue));
    },
  ]);
}

function useDateInputCalendar(
  value: string | undefined,
  defaultValue: string | undefined,
  disabled: boolean,
  scriptReady: boolean,
  onChange?: (value: string) => void,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const attachedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!scriptReady) {
      return;
    }

    const input = inputRef.current;
    if (!input || attachedRef.current) {
      return;
    }

    attachDateCalendar(input, value ?? defaultValue ?? "", (nextValue) => {
      onChangeRef.current?.(nextValue);
    });
    attachedRef.current = true;
  }, [defaultValue, scriptReady, value]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.disabled = disabled || !scriptReady;
    }
  }, [disabled, scriptReady]);

  return inputRef;
}

export function DateInput({
  id,
  name,
  value,
  defaultValue,
  disabled = false,
  required = false,
  onChange,
  "aria-label": ariaLabel,
}: DateInputProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [shouldInjectScripts] = useState(() => markCalendarScriptsRequested());
  const inputRef = useDateInputCalendar(value, defaultValue, disabled, scriptReady, onChange);

  useEffect(() => {
    void waitForBulmaDateBridge().then(() => {
      setScriptReady(true);
    });
  }, []);

  return (
    <>
      {shouldInjectScripts ? <BulmaCalendarScripts /> : null}
      <div className="control">
        <input
          ref={inputRef}
          id={id}
          name={name}
          className="input"
          type="text"
          autoComplete="off"
          readOnly
          disabled={disabled || !scriptReady}
          required={required}
          aria-label={ariaLabel}
        />
      </div>
    </>
  );
}
