import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cartItems, products } from '@/lib/db/schema'
const cookieName = 'studio_guest_cart'
async function owner(create = false) {
  const jar = await cookies()
  let token = jar.get(cookieName)?.value
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null
    token = randomBytes(32).toString('hex')
    jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' || !!process.env.V0_RUNTIME_URL, sameSite: process.env.NODE_ENV === 'development' && !!process.env.V0_RUNTIME_URL ? 'none' : 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  }
  return createHash('sha256').update(token).digest('hex')
}
async function items(userId: string | null) {
  if (!userId) return []
  return db.select({ product: products, quantity: cartItems.quantity }).from(cartItems).innerJoin(products, eq(products.id, cartItems.productId)).where(eq(cartItems.userId, userId))
}
export async function GET() {
  try { return Response.json(await items(await owner()), { headers: { 'Cache-Control': 'private, no-store' } }) }
  catch { return Response.json({ error: 'Could not load your bag.' }, { status: 503 }) }
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowed = [new URL(request.url).origin, ...['V0_RUNTIME_URL','V0_DEV_APP_URL','V0_BUILD_URL','V0_SANDBOX_URL'].map(k => process.env[k]).filter(Boolean)]
  if (!origin || !allowed.includes(origin)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 })
  try {
    const body = await request.json()
    if (typeof body.productId !== 'string' || body.productId.length > 100 || !['add','set'].includes(body.action) || !Number.isInteger(body.quantity) || body.quantity < 0 || body.quantity > 20 || (body.action === 'add' && body.quantity < 1)) return Response.json({ error: 'Invalid cart update.' }, { status: 400 })
    const [product] = await db.select().from(products).where(eq(products.id, body.productId))
    if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 })
    const userId = (await owner(true))!
    const scope = and(eq(cartItems.userId, userId), eq(cartItems.productId, product.id))
    if (body.quantity === 0) await db.delete(cartItems).where(scope)
    else {
      const cap = Math.min(20, product.stock)
      if (!cap || body.quantity > cap) return Response.json({ error: 'Requested quantity is unavailable.' }, { status: 400 })
      await db.insert(cartItems).values({ userId, productId: product.id, quantity: body.quantity }).onConflictDoUpdate({ target: [cartItems.userId, cartItems.productId], set: { quantity: body.action === 'add' ? sql`least(${cartItems.quantity} + ${body.quantity}, ${cap})` : body.quantity, updatedAt: new Date() } })
    }
    return Response.json(await items(userId))
  } catch { return Response.json({ error: 'Could not update your bag. Please try again.' }, { status: 503 }) }
}
