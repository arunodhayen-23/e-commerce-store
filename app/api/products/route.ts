import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
export async function GET() {
  try { return Response.json(await db.select().from(products)) }
  catch { return Response.json({ error: 'The catalog is temporarily unavailable.' }, { status: 503 }) }
}
