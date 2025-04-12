"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

export function SubmissionList() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  interface Submission {
    id: string;
    student: string;
    studentId: string;
    assignment: string;
    assignmentId: string;
    project: string;
    submittedAt: string;
    grade: number | null;
    remarks: string | null;
    link: string | null;
    penalty: number | null;
    status: string;
  }

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/submissions');
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError('Failed to load submissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading submissions...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  if (submissions.length === 0) {
    return <div className="flex justify-center p-8">No submissions found.</div>;
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {userRole === "Professor" && <TableHead>Student</TableHead>}
            <TableHead>Assignment</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              {userRole === "Professor" && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(submission.student)}</AvatarFallback>
                    </Avatar>
                    <span>{submission.student}</span>
                  </div>
                </TableCell>
              )}
              <TableCell>{submission.assignment}</TableCell>
              <TableCell>{submission.project}</TableCell>
              <TableCell>{formatDate(submission.submittedAt)}</TableCell>
              <TableCell>
                <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                  {submission.status === "graded" ? "Graded" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>{submission.grade !== null ? `${submission.grade}%` : "-"}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/submissions/${submission.id}`}>
                    {userRole === "Professor" && submission.status === "pending" ? "Evaluate" : "View"}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
