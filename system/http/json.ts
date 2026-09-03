import { NextResponse } from "next/server";
import * as v from "valibot";

function parseJsonWithSchema<const TSchema extends v.GenericSchema>(
  source: string,
  schema: TSchema,
): v.InferOutput<TSchema> {
  return v.parse(v.pipe(v.string(), v.parseJson(), schema), source);
}

export async function parseJsonFromReadable<const TSchema extends v.GenericSchema>(
  readable: { text(): Promise<string> },
  schema: TSchema,
): Promise<v.InferOutput<TSchema>> {
  return parseJsonWithSchema(await readable.text(), schema);
}

export function parseJsonString<const TSchema extends v.GenericSchema>(
  json: string,
  schema: TSchema,
): v.InferOutput<TSchema> {
  return parseJsonWithSchema(json, schema);
}

export function jsonResponse(data: object, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return new NextResponse(JSON.stringify(data), {
    ...init,
    headers,
  });
}
