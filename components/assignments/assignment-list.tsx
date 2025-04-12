"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Clock, MoreHorizontal } from "lucide-react"
import Link from "next/link"

interface Assignment {
  id: string;
  name: string;
  description: string | null;
  dueDate: string;
  maxPoints: number;
  project: {
    name: string;
  };
  status?: string;
  submitted?: boolean;
  submissionId?: string | null;
  grade?: number | null;
  _count?: {
    submissions: number;
  };
}

export function AssignmentList() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/assignments');
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        
        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getDaysLeft = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignments...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      
      
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-muted-foreground">No assignments found.</p>
          {userRole === "Professor" && (
            <Button asChild>
              <Link href="/dashboard/assignments/new">Create Your First Assignment</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const daysLeft = getDaysLeft(assignment.dueDate)
            const isOverdue = daysLeft < 0
            const isCompleted = assignment.status === "completed"

            return (
              <Card key={assignment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{assignment.name}</CardTitle>
                    {userRole === "Professor" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/assignments/${assignment.id}`}>View Assignment</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isCompleted ? "outline" : isOverdue ? "destructive" : "default"}>
                      {isCompleted ? "Completed" : isOverdue ? "Overdue" : `${daysLeft} days left`}
                    </Badge>
                  </div>
                  <CardDescription>{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Due: {formatDate(assignment.dueDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Max Points: {assignment.maxPoints}</span>
                    </div>
                    <div className="text-muted-foreground">Project: {assignment.project.name}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  {userRole === "Student" && !isCompleted ? (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/assignments/${assignment.id}`}>Submit Assignment</Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/dashboard/assignments/${assignment.id}`}>View Details</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
