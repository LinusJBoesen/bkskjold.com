import { getDb } from "../lib/db";

interface EventAttendance {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventType: string;
  playerId: string;
  response: string;
  respondedAt: string | null;
}

export function calculateEventFines(
  eventId: string,
  eventName: string,
  eventDate: string,
  eventType: string,
  attendance: Array<{ playerId: string; response: string; respondedAt: string | null }>
) {
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
      // Missing match or training
      const fineTypeId = isMatch ? "missing_match" : "missing_training";
      const amount = isMatch ? 100 : 30;
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
      // No response within 24h
      fines.push({
        playerId: att.playerId,
        fineTypeId: "no_response_24h",
        eventId,
        eventName,
        eventDate,
        amount: 60,
      });
    }
  }

  return fines;
}

export function generateAutoFines() {
  const db = getDb();

  const events = db.query(`
    SELECT se.id, se.name, se.start_time, se.event_type,
           sa.player_id, sa.response, sa.responded_at
    FROM spond_events se
    JOIN spond_attendance sa ON se.id = sa.event_id
  `).all() as EventAttendance[];

  // Group by event
  const byEvent = new Map<string, typeof events>();
  for (const row of events) {
    const key = row.eventId;
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key)!.push(row);
  }

  let created = 0;
  const insertFine = db.prepare(`
    INSERT OR IGNORE INTO fines (id, player_id, fine_type_id, event_id, event_name, event_date, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [eventId, rows] of byEvent) {
    const first = rows[0];
    const attendance = rows.map((r) => ({
      playerId: r.playerId,
      response: r.response,
      respondedAt: r.respondedAt,
    }));

    const fines = calculateEventFines(
      eventId,
      first.eventName,
      first.eventDate,
      first.eventType || "training",
      attendance
    );

    for (const fine of fines) {
      const id = `auto-${fine.playerId}-${fine.eventId}-${fine.fineTypeId}`;
      const result = insertFine.run(id, fine.playerId, fine.fineTypeId, fine.eventId, fine.eventName, fine.eventDate, fine.amount);
      if (result.changes > 0) created++;
    }
  }

  return created;
}
