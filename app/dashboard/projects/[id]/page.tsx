"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Users } from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  professorId: string
  createdAt: string
  updatedAt: string
  professor?: {
    id: string
    userId: string
    user?: {
      name: string
    }
  }
  assignments: Array<{
    id: string
    name: string
    description: string | null
    dueDate: string
    maxPoints: number
    _count?: {
      submissions: number
    }
  }>
}

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch project details')
        }
        
        const data = await response.json()
        setProject(data)
      } catch (err) {
        console.error('Error fetching project:', err)
        setError('Failed to load project details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading project details...</div>
  }

  if (error || !project) {
    return <div className="flex justify-center p-8 text-red-500">{error || 'Project not found'}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{project.name}</h3>
          <p className="text-muted-foreground">
            Created on {formatDate(project.createdAt)}
          </p>
        </div>
        {/* {userRole === "Professor" && (
          <Button asChild>
            <Link href={`/dashboard/projects/${project.id}/edit`}>Edit Project</Link>
          </Button>
        )} */}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="default">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.description || 'No description provided'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>{project.assignments.length} Assignments</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span>Last updated: {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="assignments" className="mt-6">
            <TabsList>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>
            <TabsContent value="assignments" className="space-y-4 pt-4">
              {project.assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <p className="text-muted-foreground">No assignments found.</p>
                  {userRole === "Professor" && (
                    <Button asChild>
                      <Link href={`/dashboard/assignments/new?projectId=${project.id}`}>Create Assignment</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {project.assignments.map((assignment) => {
                    const dueDate = new Date(assignment.dueDate)
                    const isOverdue = new Date() > dueDate
                    
                    return (
                      <Card key={assignment.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{assignment.name}</CardTitle>
                            <Badge variant={isOverdue ? "destructive" : "default"}>
                              {isOverdue ? "Overdue" : "Active"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-2">{assignment.description}</CardDescription>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>Due: {formatDate(assignment.dueDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <span>Max Points: {assignment.maxPoints}</span>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button asChild size="sm" className="w-full">
                              <Link href={`/dashboard/assignments/${assignment.id}`}>
                                {userRole === "Student" ? "Submit Assignment" : "View Submissions"}
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
              {userRole === "Professor" && project.assignments.length > 0 && (
                <div className="flex justify-end mt-4">
                  <Button asChild>
                    <Link href={`/dashboard/assignments/new?projectId=${project.id}`}>Add Assignment</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="students" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Student enrollment data will be displayed here.</p>
                    {userRole === "Professor" && (
                      <Button className="mt-4" asChild>
                        <Link href={`/dashboard/projects/${project.id}/students`}>Manage Students</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
               
                <div>
                  <h4 className="text-sm font-medium">Created</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(project.createdAt)}</p>
                </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
