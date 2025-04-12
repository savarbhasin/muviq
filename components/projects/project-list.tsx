"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, MoreHorizontal, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ProjectList() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  interface Project {
    id: string;
    name: string;
    description: string | null;
    professorId: string;
    createdAt: string;
    updatedAt: string;
    assignments?: Array<{
      id: string;
      name: string;
      _count?: {
        submissions: number;
      };
    }>;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentCount, setStudentCount] = useState(0);
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
            
            const isActive = true; // Assuming all projects are active by default
            
            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{project.name}</CardTitle>
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
                            <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/submissions">View Submissions</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
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
