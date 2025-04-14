"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, MoreHorizontal, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Project } from "@prisma/client"

export function ProjectList() {
  const { data: session } = useSession()
  const userRole = session?.user?.role


  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const response2 = await fetch('/api/students');
        
        if (!response2.ok) {
          throw new Error('Failed to fetch students');
        }
        
        const students = await response2.json();
        setStudentCount(students.length);
        
        // Fetch submission counts for professors
        if (session?.user?.role === 'Professor') {
          try {
            const submissionsResponse = await fetch('/api/submissions/counts');
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json();
              const counts: Record<string, number> = {};
              
              // Convert array of counts to a map of projectId -> count
              submissionsData.forEach((item: any) => {
                counts[item.projectId] = item.count;
              });
              
              setSubmissionCounts(counts);
            }
          } catch (err) {
            console.error('Error fetching submission counts:', err);
          }
        }
        
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  return (
    <>
      
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-muted-foreground">No projects found.</p>
          {userRole === "Professor" && (
            <Button asChild>
              <Link href="/dashboard/projects/new">Create Your First Project</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const assignmentCount = project.assignments?.length || 0;
            
            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{project.name}</CardTitle>
                    {
                      userRole === "Student" && <Badge>{project.professor.user.name}</Badge>
                    }
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{assignmentCount} Assignments</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>{studentCount} Students</span>
                    </div>
                  </div>
                  {userRole === "Professor" && (
                    <div className="mt-2 pt-2 border-t flex items-center text-sm">
                      <span className="text-muted-foreground">Total Submissions:</span>
                      <Badge variant="outline" className="ml-2">
                        {submissionCounts[project.id] || 0}
                      </Badge>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </>
  )
}
