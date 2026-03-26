import { sql } from "../lib/db";

interface EventAttendance {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  playerId: string;
  response: string;
  respondedAt: string | null;
}

export async function calculateEventFines(
  eventId: string,
  eventName: string,
  eventDate: string,
  eventType: string,
  attendance: Array<{ playerId: string; response: string; respondedAt: string | null }>
) {
  // Look up amounts from fine_types table
  const fineTypeRows = await sql`
    SELECT id, amount FROM fine_types WHERE id IN ('missing_match', 'missing_training', 'no_response_24h')
  ` as { id: string; amount: number }[];

  const fineAmounts: Record<string, number> = {};
  for (const row of fineTypeRows) {
    fineAmounts[row.id] = row.amount;
  }

  const fines: Array<{
    playerId: string;
    fineTypeId: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    amount: number;
  }> = [];

  const isMatch = eventType === "match";

  for (const att of attendance) {
    if (att.response === "declined" || att.response === "unanswered") {
      const fineTypeId = isMatch ? "missing_match" : "missing_training";
      const amount = fineAmounts[fineTypeId] ?? (isMatch ? 100 : 30);
      fines.push({
        playerId: att.playerId,
        fineTypeId,
        eventId,
        eventName,
        eventDate,
        amount,
      });
    }

    if (att.response === "unanswered") {
      fines.push({
        playerId: att.playerId,
        fineTypeId: "no_response_24h",
        eventId,
        eventName,
        eventDate,
        amount: fineAmounts["no_response_24h"] ?? 60,
      });
    }
  }

  return fines;
}

export async function generateAutoFines() {
  const events = await sql`
    SELECT se.id as "eventId", se.name as "eventName", se.start_time as "eventDate", se.event_type as "eventType",
           sa.player_id as "playerId", sa.response, sa.responded_at as "respondedAt"
    FROM spond_events se
    JOIN spond_attendance sa ON se.id = sa.event_id
  ` as EventAttendance[];

  // Group by event
  const byEvent = new Map<string, typeof events>();
  for (const row of events) {
    const key = row.eventId;
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key)!.push(row);
  }

  let created = 0;

  for (const [eventId, rows] of byEvent) {
    const first = rows[0]!;
    const attendance = rows.map((r) => ({
      playerId: r.playerId,
      response: r.response,
      respondedAt: r.respondedAt,
    }));

    const fines = await calculateEventFines(
      eventId,
      first.eventName,
      first.eventDate,
      first.eventType || "training",
      attendance
    );

    for (const fine of fines) {
      const id = `auto-${fine.playerId}-${fine.eventId}-${fine.fineTypeId}`;
      const result = await sql`
        INSERT INTO fines (id, player_id, fine_type_id, event_id, event_name, event_date, amount)
        VALUES (${id}, ${fine.playerId}, ${fine.fineTypeId}, ${fine.eventId}, ${fine.eventName}, ${fine.eventDate}, ${fine.amount})
        ON CONFLICT DO NOTHING
      `;
      if (result.count > 0) created++;
    }
  }

  return created;
}
