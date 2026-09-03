import { readRows, rowExists } from "@/system/database/read-row";
import type { Database } from "bun:sqlite";
import * as v from "valibot";
import { EventPropertiesSchema } from "@/system/events/event-properties.schema";
import type { InsertEventInput, StoredEvent } from "@/system/events/event.types";
import { parseJsonString } from "@/system/http/json";

const EventRowSchema = v.object({
  event_id: v.string(),
  session_id: v.string(),
  event_name: v.string(),
  server_timestamp: v.string(),
  client_timestamp: v.string(),
  version_id: v.string(),
  variant: v.string(),
  step_id: v.nullable(v.string()),
  utm_source: v.nullable(v.string()),
  utm_medium: v.nullable(v.string()),
  utm_campaign: v.nullable(v.string()),
  utm_term: v.nullable(v.string()),
  utm_content: v.nullable(v.string()),
  transition_id: v.nullable(v.string()),
  properties_json: v.string(),
});

function optionalString(value: string | null): string | null {
  return value;
}

function mapRow(row: v.InferOutput<typeof EventRowSchema>): StoredEvent {
  return {
    eventId: row.event_id,
    sessionId: row.session_id,
    eventName: row.event_name,
    serverTimestamp: row.server_timestamp,
    clientTimestamp: row.client_timestamp,
    versionId: row.version_id,
    variant: row.variant,
    stepId: optionalString(row.step_id),
    utmSource: optionalString(row.utm_source),
    utmMedium: optionalString(row.utm_medium),
    utmCampaign: optionalString(row.utm_campaign),
    utmTerm: optionalString(row.utm_term),
    utmContent: optionalString(row.utm_content),
    transitionId: optionalString(row.transition_id),
    properties: parseJsonString(row.properties_json, EventPropertiesSchema),
  };
}

export function createEventDao(db: Database) {
  function insertEvent(input: InsertEventInput): "inserted" | "duplicate" {
    try {
      db.query(
        `
          INSERT INTO events (
            event_id, session_id, event_name, client_timestamp,
            version_id, variant, step_id,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            transition_id, properties_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        input.eventId,
        input.sessionId,
        input.eventName,
        input.clientTimestamp,
        input.versionId,
        input.variant,
        input.stepId ?? null,
        input.utmSource ?? null,
        input.utmMedium ?? null,
        input.utmCampaign ?? null,
        input.utmTerm ?? null,
        input.utmContent ?? null,
        input.transitionId ?? null,
        JSON.stringify(input.properties),
      );
      return "inserted";
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        return "duplicate";
      }
      throw error;
    }
  }

  function eventExists(eventId: string): boolean {
    return rowExists(db, `SELECT 1 FROM events WHERE event_id = ?`, eventId);
  }

  function listBySession(sessionId: string): StoredEvent[] {
    return readRows(
      db,
      `SELECT * FROM events WHERE session_id = ? ORDER BY server_timestamp ASC`,
      [sessionId],
      EventRowSchema,
    ).map(mapRow);
  }

  return { insertEvent, eventExists, listBySession };
}
