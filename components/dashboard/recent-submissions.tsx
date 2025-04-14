"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RecentSubmissions() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  interface Submission {
    id: string;
    student: string;
    assignment: string;
    project: string;
    submittedAt: string;
    status: string;
    grade: number | null;
  }

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        if (data.recentSubmissions) {
          setSubmissions(data.recentSubmissions);
        }
      } catch (err) {
        console.error('Error fetching recent submissions:', err);
        setError('Failed to load recent submissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const getInitials = (name: string) => {
    return name ? name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() : ""
  }

  if (loading) {
    return <div className="flex h-[200px] items-center justify-center">Loading recent submissions...</div>;
  }

  if (error) {
    return <div className="flex h-[200px] items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">No submissions yet</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="flex items-center justify-between space-x-4 rounded-md border p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(submission.student)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {userRole === "Professor" ? submission.student : submission.assignment}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {submission.project} • {formatDate(submission.submittedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                  {submission.status === "graded" ? `${submission.grade}%` : "Pending"}
                </Badge>
                {
                  userRole == 'Professor' && 
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/submissions/${submission.id}`}>
                      Review
                    </Link>
                  </Button>
                }
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard/submissions">View all submissions</Link>
        </Button>
      </div>
    </div>
  )
}
