import { Hono } from "hono";
import { sql } from "../lib/db";
import { requireRole } from "../middleware/auth";
import { randomUUID } from "crypto";

const app = new Hono();

// GET /api/bodekasse — returns balance summary + expenses list
app.get("/", async (c) => {
  const [expensesRows, paidRows] = await Promise.all([
    sql`SELECT id, description, amount, created_at FROM bodekasse_expenses ORDER BY created_at DESC`,
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE paid = 1`,
  ]);

  const totalPaid = Number(paidRows[0]?.total ?? 0);
  const totalUsed = expensesRows.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const remaining = totalPaid - totalUsed;

  return c.json({ totalPaid, totalUsed, remaining, expenses: expensesRows });
});

// POST /api/bodekasse — add expense (admin only)
app.post("/", requireRole("admin"), async (c) => {
  const body = await c.req.json<{ description: string; amount: number }>();
  if (!body.description || !body.amount) {
    return c.json({ error: "description og amount er påkrævet" }, 400);
  }
  const id = randomUUID();
  await sql`
    INSERT INTO bodekasse_expenses (id, description, amount)
    VALUES (${id}, ${body.description}, ${body.amount})
  `;
  return c.json({ id }, 201);
});

// DELETE /api/bodekasse/:id — remove expense (admin only)
app.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM bodekasse_expenses WHERE id = ${id}`;
  return c.json({ success: true });
});

export default app;
