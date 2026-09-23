import "server-only"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"

export type Profile = typeof profiles.$inferSelect

// Returns the current session user's forum profile (creating one on first
// visit after sign-up), or null when signed out.
export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)
  if (existing[0]) return existing[0]

  // First login: create a profile from the auth user.
  // The very first real (non-AI) member becomes the site admin.
  const [{ humanCount }] = await db
    .select({ humanCount: sql<number>`count(*)::int` })
    .from(profiles)
    .where(eq(profiles.isAI, false))

  const base = (session.user.name || session.user.email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "uye"
  let username = base
  for (let i = 0; i < 5; i++) {
    try {
      const inserted = await db
        .insert(profiles)
        .values({
          userId: session.user.id,
          username,
          displayName: session.user.name || username,
          isAdmin: humanCount === 0,
        })
        .returning()
      return inserted[0]
    } catch {
      username = `${base}${Math.floor(Math.random() * 9999)}`
    }
  }
  return null
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error("Giriş yapmalısınız")
  if (profile.isBanned) throw new Error("Hesabınız askıya alınmış")
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile()
  if (!profile.isAdmin) throw new Error("Yetkiniz yok")
  return profile
}
