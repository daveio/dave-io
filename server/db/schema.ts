import { sqliteTable, text } from "drizzle-orm/sqlite-core"

/* The `redirects` constant is defining a SQLite table named
"redirects" with two columns: "slug" and "destination". The "slug"
column is of type text, unique, and serves as the primary key for
the table. The "destination" column is also of type text and is
marked as not nullable. This table definition is using the
`drizzle-orm/sqlite-core` library for SQLite database operations in
a TypeScript environment. */
export const redirects = sqliteTable("redirects", {
  slug: text().unique().primaryKey(),
  destination: text().notNull(),
})
