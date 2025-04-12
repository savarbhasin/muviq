import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubmissionList } from "@/components/submissions/submission-list"

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">
          {userRole === "Professor" ? "View and evaluate student submissions" : "View your submissions"}
        </p>
      </div>

      <SubmissionList />
    </div>
  )
}
