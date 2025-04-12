import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AssignmentList } from "@/components/assignments/assignment-list"

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userRole = session.user.role

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">
            {userRole === "Professor" ? "Manage your assignments" : "View your assignments"}
          </p>
        </div>
        {userRole === "Professor" && (
          <Button asChild>
            <Link href="/dashboard/assignments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Link>
          </Button>
        )}
      </div>

      <AssignmentList />
    </div>
  )
}
