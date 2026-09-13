import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core'
export const products = pgTable('products', { id: text('id').primaryKey(), name: text('name').notNull(), category: text('category').notNull(), description: text('description').notNull(), price: integer('price').notNull(), image: text('image').notNull(), stock: integer('stock').notNull() })
export const cartItems = pgTable('guest_cart_items', { userId: text('userId').notNull(), productId: text('productId').notNull(), quantity: integer('quantity').notNull(), updatedAt: timestamp('updatedAt').defaultNow().notNull() }, t => [primaryKey({ columns: [t.userId, t.productId] })])
export type Product = typeof products.$inferSelect
