"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, FileText, Upload, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Assignment {
  id: string
  name: string
  description: string | null
  rubrics: string | null
  dueDate: string
  maxPoints: number
  projectId: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    name: string
    professorId: string
    professor?: {
      id: string
      userId: string
      user?: {
        name: string
      }
    }
  }
  submissions?: Array<{
    id: string
    content: string
    grade: number | null
    feedback: string | null
    studentId: string
    createdAt: string
    student: {
      user: {
        name: string
      }
    }
  }>
}

export default function AssignmentDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submissionContent, setSubmissionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userSubmission, setUserSubmission] = useState<any>(null)

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/assignments/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignment details')
        }
        
        const data = await response.json()
        setAssignment(data)

        // If student, check if they have already submitted
        if (userRole === 'Student' && data.submissions) {
          const userSub = data.submissions.find((sub: any) => 
            sub.student?.user?.email === session?.user?.email
          )
          if (userSub) {
            setUserSubmission(userSub)
            setSubmissionContent(userSub.content)
          }
        }
      } catch (err) {
        console.error('Error fetching assignment:', err)
        setError('Failed to load assignment details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchAssignment()
    }
  }, [id, session?.user?.email, userRole])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getDaysLeft = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!submissionContent.trim()) {
      toast({
        title: "Error",
        description: "Submission content cannot be empty",
        variant: "destructive"
      })
      return
    }
 
    try {
      setSubmitting(true)
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignmentId: id,
          content: submissionContent
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit assignment")
      }

      const submission = await response.json()
      setUserSubmission(submission)
      toast({
        title: "Success",
        description: "Assignment submitted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit assignment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading assignment details...</div>
  }

  if (error || !assignment) {
    return <div className="flex justify-center p-8 text-red-500">{error || 'Assignment not found'}</div>
  }

  const daysLeft = getDaysLeft(assignment.dueDate)
  const isOverdue = daysLeft < 0
  const hasSubmitted = !!userSubmission

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{assignment.name}</h3>
          <p className="text-muted-foreground">
            Project: {assignment.project?.name || 'Unknown Project'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isOverdue ? "destructive" : hasSubmitted ? "outline" : "default"}>
            {hasSubmitted ? "Submitted" : isOverdue ? "Overdue" : `${daysLeft} days left`}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {assignment.description || 'No description provided'}
                  </p>
                </div>
                {assignment.rubrics && (
                  <div>
                    <h4 className="text-sm font-medium">Rubrics</h4>
                    <p className="text-sm text-muted-foreground">
                      {assignment.rubrics}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Due: {formatDate(assignment.dueDate)} at {formatTime(assignment.dueDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Max Points: {assignment.maxPoints}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "Student" ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Submission</CardTitle>
                <CardDescription>
                  {hasSubmitted 
                    ? `Submitted on ${formatDate(userSubmission.createdAt)} at ${formatTime(userSubmission.createdAt)}` 
                    : isOverdue 
                      ? "This assignment is overdue, but you can still submit" 
                      : `You have ${daysLeft} days left to submit`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasSubmitted && userSubmission.grade !== null ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Your Grade</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-lg py-1 px-2">
                          {userSubmission.grade} / {assignment.maxPoints}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({Math.round((userSubmission.grade / assignment.maxPoints) * 100)}%)
                        </span>
                      </div>
                    </div>
                    {userSubmission.feedback && (
                      <div>
                        <h4 className="text-sm font-medium">Feedback</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userSubmission.feedback}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium">Your Submission</h4>
                      <div className="bg-muted p-3 rounded-md mt-1">
                        <p className="text-sm whitespace-pre-wrap">{userSubmission.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Enter your submission here..."
                          className="min-h-[200px]"
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          disabled={submitting || hasSubmitted}
                        />
                      </div>
                      {hasSubmitted ? (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            Your submission is awaiting grading. You cannot edit your submission at this time.
                          </p>
                        </div>
                      ) : (
                        <Button type="submit" disabled={submitting} className="w-full">
                          {submitting ? "Submitting..." : "Submit Assignment"}
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="submissions" className="mt-6">
              <TabsList>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
              </TabsList>
              <TabsContent value="submissions" className="space-y-4 pt-4">
                {assignment.submissions && assignment.submissions.length > 0 ? (
                  <div className="space-y-4">
                    {assignment.submissions.map((submission) => (
                      <Card key={submission.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{submission.student.user.name}</CardTitle>
                            <Badge variant={submission.grade !== null ? "outline" : "default"}>
                              {submission.grade !== null ? `${submission.grade}/${assignment.maxPoints}` : "Ungraded"}
                            </Badge>
                          </div>
                          <CardDescription>
                            Submitted on {formatDate(submission.createdAt)} at {formatTime(submission.createdAt)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Submission</h4>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button asChild className="w-full">
                            <Link href={`/dashboard/submissions/${submission.id}/grade`}>
                              {submission.grade !== null ? "Update Grade" : "Grade Submission"}
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No submissions yet.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="statistics" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">{assignment.submissions?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Submissions</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">
                            {assignment.submissions?.filter(s => s.grade !== null).length || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Graded</p>
                        </div>
                        <div className="bg-muted p-4 rounded-md text-center">
                          <p className="text-2xl font-bold">
                            {assignment.submissions?.filter(s => s.grade === null).length || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Pending</p>
                        </div>
                      </div>
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Detailed statistics will be displayed here.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Professor</h4>
                  <p className="text-sm text-muted-foreground">{assignment.project?.professor?.user?.name || 'Unknown Professor'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Project</h4>
                  <p className="text-sm text-muted-foreground">{assignment.project?.name || 'Unknown Project'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Due Date</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(assignment.dueDate)} at {formatTime(assignment.dueDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Created</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(assignment.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "Student" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant={hasSubmitted ? "outline" : isOverdue ? "destructive" : "default"}>
                      {hasSubmitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                    </Badge>
                  </div>
                  {hasSubmitted && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Submitted on:</span>
                      <span className="text-sm">{formatDate(userSubmission.createdAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Due Date:</span>
                    <span className="text-sm">{formatDate(assignment.dueDate)}</span>
                  </div>
                  {!hasSubmitted && (
                    <div className="mt-4">
                      <Button asChild className="w-full">
                        <a href="#submission-form">
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Now
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
