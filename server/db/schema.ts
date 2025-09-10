import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const redirects = sqliteTable("redirects", {
  slug: text().unique().notNull().primaryKey(),
  destination: text().notNull(),
})
