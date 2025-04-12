import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BadgeGrid } from "@/components/badges/badge-grid"

export default async function BadgesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Badges</h2>
        <p className="text-muted-foreground">View your earned badges and achievements</p>
      </div>

      <BadgeGrid />
    </div>
  )
}
