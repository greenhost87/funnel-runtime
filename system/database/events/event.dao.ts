import type { Database } from "bun:sqlite";
import type { FunnelVariant } from "@/system/funnel/config.types";
import type { StoredEvent } from "@/system/events/event.types";

export class EventDao {
  constructor(private readonly db: Database) {}

  insertEvent(input: {
    eventId: string;
    sessionId: string;
    eventName: string;
    clientTimestamp: string;
    versionId: string;
    variant: FunnelVariant;
    stepId?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    transitionId?: string | null;
    properties: Record<string, unknown>;
  }): "inserted" | "duplicate" {
    try {
      this.db
        .query(
          `
          INSERT INTO events (
            event_id, session_id, event_name, client_timestamp,
            version_id, variant, step_id,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            transition_id, properties_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .run(
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

  eventExists(eventId: string): boolean {
    const row = this.db.query(`SELECT 1 FROM events WHERE event_id = ?`).get(eventId);
    return row !== null;
  }

  listBySession(sessionId: string): StoredEvent[] {
    const rows = this.db
      .query(`SELECT * FROM events WHERE session_id = ? ORDER BY server_timestamp ASC`)
      .all(sessionId) as Array<Record<string, unknown>>;
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: Record<string, unknown>): StoredEvent {
    return {
      eventId: String(row.event_id),
      sessionId: String(row.session_id),
      eventName: String(row.event_name),
      serverTimestamp: String(row.server_timestamp),
      clientTimestamp: String(row.client_timestamp),
      versionId: String(row.version_id),
      variant: String(row.variant),
      stepId: row.step_id ? String(row.step_id) : null,
      utmSource: row.utm_source ? String(row.utm_source) : null,
      utmMedium: row.utm_medium ? String(row.utm_medium) : null,
      utmCampaign: row.utm_campaign ? String(row.utm_campaign) : null,
      utmTerm: row.utm_term ? String(row.utm_term) : null,
      utmContent: row.utm_content ? String(row.utm_content) : null,
      transitionId: row.transition_id ? String(row.transition_id) : null,
      properties: JSON.parse(String(row.properties_json)) as Record<string, unknown>,
    };
  }
}
