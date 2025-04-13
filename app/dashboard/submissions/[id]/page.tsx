"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Submission {
  id: string
  content: string
  grade: number | null
  feedback: string | null
  assignmentId: string
  studentId: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    userId: string
    user?: {
      name: string
      email: string
    }
  }
  assignment: {
    id: string
    name: string
    description: string | null
    dueDate: string
    maxPoints: number
    projectId: string
    project?: {
      id: string
      name: string
    }
  }
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  if (!id) {
    return <div className="flex justify-center p-8 text-red-500">Invalid submission ID</div>;
  }
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grading, setGrading] = useState(false)
  const [aiGrading, setAiGrading] = useState(false)
  const [gradeData, setGradeData] = useState({
    grade: '',
    feedback: ''
  })

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/submissions/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch submission details')
        }
        
        const data = await response.json()
        console.log(data)
        setSubmission(data)
        
        if (data.grade !== null) {
          setGradeData({
            grade: data.grade.toString(),
            feedback: data.feedback || ''
          })
        }
      } catch (err) {
        console.error('Error fetching submission:', err)
        setError('Failed to load submission details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchSubmission()
    }
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleGradeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGradeData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gradeData.grade) {
      toast({
        title: "Error",
        description: "Grade is required",
        variant: "destructive"
      })
      return
    }

    const gradeNum = parseFloat(gradeData.grade)
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > (submission?.assignment.maxPoints || 100)) {
      toast({
        title: "Error",
        description: `Grade must be between 0 and ${submission?.assignment.maxPoints || 100}`,
        variant: "destructive"
      })
      return
    }

    try {
      setGrading(true)
      const response = await fetch(`/api/submissions/${id}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grade: gradeNum,
          feedback: gradeData.feedback
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to grade submission")
      }

      const updatedSubmission = await response.json()
      setSubmission(updatedSubmission)
      toast({
        title: "Success",
        description: "Submission graded successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission",
        variant: "destructive"
      })
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading submission details...</div>
  }

  if (error || !submission || !submission.assignment) {
    return <div className="flex justify-center p-8 text-red-500">{error || 'Submission not found'}</div>
  }

  // Check if user has permission to view this submission
  const isStudent = userRole === "Student"
  const isProfessor = userRole === "Professor"
  const isSubmitter = isStudent && session?.user?.email === submission.student?.user?.email
  
  if (isStudent && !isSubmitter) {
    return <div className="flex justify-center p-8 text-red-500">You do not have permission to view this submission</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Submission Details</h3>
          <p className="text-muted-foreground">
            {isStudent ? "Your submission" : `Submission by ${submission.student?.user?.name || 'Student'}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={submission.grade !== null ? "outline" : "default"}>
            {submission.grade !== null ? "Graded" : "Pending"}
          </Badge>
          {submission.assignment && (
            <Button asChild variant="outline">
              <Link href={`/dashboard/assignments/${submission.assignment.id}`}>View Assignment</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Assignment: {submission.assignment.name}</CardTitle>
              <CardDescription>
                Project: {submission.assignment.project?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Assignment Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {submission.assignment.description || 'No description provided'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    {/* <span>Due: {formatDate(submission.assignment.dueDate)}</span> */}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Max Points: {submission.assignment.maxPoints}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Submission Content</CardTitle>
              <CardDescription>
                {/* Submitted on {formatDate(submission.createdAt)} at {formatTime(submission.createdAt)} */}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{submission.content}</p>
              </div>
            </CardContent>
          </Card>

          {isProfessor && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{submission.grade !== null ? "Update Grade" : "Grade Submission"}</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmitGrade}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="grade" className="text-right">
                        Grade (out of {submission.assignment.maxPoints})
                      </Label>
                      <Input
                        id="grade"
                        name="grade"
                        className="col-span-3"
                        value={gradeData.grade}
                        onChange={handleGradeChange}
                        type="number"
                        min="0"
                        max={submission.assignment.maxPoints}
                        step="0.1"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="feedback" className="text-right">
                        Feedback
                      </Label>
                      <Textarea
                        id="feedback"
                        name="feedback"
                        className="col-span-3"
                        value={gradeData.feedback}
                        onChange={handleGradeChange}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        setAiGrading(true);
                        const response = await fetch(`/api/submissions/${id}/grade-ai`, {
                          method: 'POST'
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to grade with AI');
                        }

                        const updatedSubmission = await response.json();
                        setSubmission(updatedSubmission);
                        setGradeData({
                          grade: updatedSubmission.grade.toString(),
                          feedback: updatedSubmission.feedback || ''
                        });
                        toast({
                          title: 'Success',
                          description: 'AI grading completed successfully'
                        });
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to grade with AI',
                          variant: 'destructive'
                        });
                      } finally {
                        setAiGrading(false);
                      }
                    }}
                    disabled={aiGrading || grading}
                  >
                    {aiGrading ? 'AI Grading...' : 'Grade with AI'}
                  </Button>
                  <Button type="submit" disabled={grading || aiGrading}>
                    {grading ? 'Saving...' : submission.grade !== null ? 'Update Grade' : 'Submit Grade'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>

        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submission Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Student</h4>
                  <p className="text-sm text-muted-foreground">{submission.student?.user?.name || 'Student'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Submitted On</h4>
                  {/* <p className="text-sm text-muted-foreground">{formatDate(submission.createdAt)} at {formatTime(submission.createdAt)}</p> */}
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant={submission.grade !== null ? "outline" : "default"}>
                      {submission.grade !== null ? "Graded" : "Pending"}
                    </Badge>
                  </div>
                </div>
                {submission.grade !== null && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium">Grade</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-lg py-1 px-2">
                          {submission.grade} / {submission.assignment.maxPoints}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({Math.round((submission.grade / submission.assignment.maxPoints) * 100)}%)
                        </span>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div>
                        <h4 className="text-sm font-medium">Feedback</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/submissions">
                  <FileText className="mr-2 h-4 w-4" />
                  All Submissions
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/dashboard/assignments/${submission.assignment.id}`}>
                  View Assignment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
