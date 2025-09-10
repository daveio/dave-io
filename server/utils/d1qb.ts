import { D1QB } from "workers-qb"

export interface Env {
  DB: D1Database
}

export async function getRedirect(env: Env, slug: string) {
  const qb = new D1QB(env.DB)

  type Redirect = {
    destination: string
    slug: string
  }

  return await qb
    .fetchOne<Redirect>({
      tableName: "redirects",
      where: {
        conditions: "slug = ?1",
        params: [slug],
      },
    })
    .execute()
}
