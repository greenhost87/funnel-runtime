import * as v from "valibot";
import type { JsonValue } from "@/system/http/json";

export const EventPropertyValueSchema: v.GenericSchema<JsonValue> = v.lazy(() =>
  v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.array(EventPropertyValueSchema),
    v.record(v.string(), EventPropertyValueSchema),
  ]),
);

export const EventPropertiesSchema = v.record(v.string(), EventPropertyValueSchema);

type EventPropertyValue = v.InferOutput<typeof EventPropertyValueSchema>;
export type EventProperties = v.InferOutput<typeof EventPropertiesSchema>;

const FORBIDDEN_PROPERTY_KEYS = ["answer", "answers", "rawAnswer", "rawAnswers", "value"];

const PrimitiveEventPropertyValueSchema = v.union([v.string(), v.number(), v.boolean(), v.null()]);

function joinPropertyPath(path: string, segment: string): string {
  return path ? `${path}.${segment}` : segment;
}

function findForbiddenInArray(items: EventPropertyValue[], path: string): string | null {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item === undefined) {
      continue;
    }
    const found = findForbiddenPropertyKey(item, `${path}[${index}]`);
    if (found) {
      return found;
    }
  }
  return null;
}

function findForbiddenInObject(properties: EventProperties, path: string): string | null {
  for (const [key, nested] of Object.entries(properties)) {
    if (FORBIDDEN_PROPERTY_KEYS.includes(key)) {
      return joinPropertyPath(path, key);
    }
    const found = findForbiddenPropertyKey(nested, joinPropertyPath(path, key));
    if (found) {
      return found;
    }
  }
  return null;
}

function findForbiddenPropertyKey(value: EventPropertyValue, path = ""): string | null {
  const primitiveResult = v.safeParse(PrimitiveEventPropertyValueSchema, value);
  if (primitiveResult.success) {
    return null;
  }

  const arrayResult = v.safeParse(v.array(EventPropertyValueSchema), value);
  if (arrayResult.success) {
    return findForbiddenInArray(arrayResult.output, path);
  }

  const objectResult = v.safeParse(EventPropertiesSchema, value);
  if (objectResult.success) {
    return findForbiddenInObject(objectResult.output, path);
  }
  return null;
}

function stripForbiddenPropertyKeys(value: EventPropertyValue): EventPropertyValue {
  const primitiveResult = v.safeParse(PrimitiveEventPropertyValueSchema, value);
  if (primitiveResult.success) {
    return primitiveResult.output;
  }

  const arrayResult = v.safeParse(v.array(EventPropertyValueSchema), value);
  if (arrayResult.success) {
    return arrayResult.output.map(stripForbiddenPropertyKeys);
  }

  const objectResult = v.safeParse(EventPropertiesSchema, value);
  if (objectResult.success) {
    const sanitized: EventProperties = {};
    for (const [key, nested] of Object.entries(objectResult.output)) {
      if (FORBIDDEN_PROPERTY_KEYS.includes(key)) {
        continue;
      }
      sanitized[key] = stripForbiddenPropertyKeys(nested);
    }
    return sanitized;
  }

  return value;
}

export function validateEventProperties(properties: EventProperties | undefined): string | null {
  if (!properties) {
    return null;
  }
  const forbidden = findForbiddenPropertyKey(properties);
  if (forbidden) {
    return `Raw answer fields are not allowed in event properties (${forbidden})`;
  }
  return null;
}

export function sanitizeEventProperties(properties: EventProperties | undefined): EventProperties {
  if (!properties) {
    return {};
  }
  const parsed = v.parse(EventPropertiesSchema, properties);
  const sanitized = stripForbiddenPropertyKeys(parsed);
  const objectResult = v.safeParse(EventPropertiesSchema, sanitized);
  return objectResult.success ? objectResult.output : {};
}
