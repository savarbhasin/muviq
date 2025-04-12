"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Project {
  id: string
  name: string
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [date, setDate] = useState<Date | undefined>(undefined)
  
  // get projectId param and set it in form
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")

  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rubrics: "",
    maxPoints: "100",
    projectId: projectId || ""
  })

  // Redirect if not a professor
  if (session?.user?.role !== "Professor") {
    router.push("/dashboard")
    return null
  }


  // Fetch projects for the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (!response.ok) {
          throw new Error("Failed to fetch projects")
        }
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Error fetching projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.projectId || !date) {
      toast({
        title: "Error",
        description: "Name, project, and due date are required",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          dueDate: date.toISOString(),
          maxPoints: parseInt(formData.maxPoints)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create assignment")
      }

      const assignment = await response.json()
      toast({
        title: "Success",
        description: "Assignment created successfully"
      })
      
      // Redirect to the assignments page
      router.push(`/dashboard/assignments/${assignment.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create New Assignment</h3>
        <p className="text-sm text-muted-foreground">
          Create a new assignment for students to complete.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Fill in the details for your new assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assignment Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter assignment name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => handleSelectChange("projectId", value)}
                disabled={loadingProjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter assignment description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubrics">Rubrics</Label>
              <Textarea
                id="rubrics"
                name="rubrics"
                value={formData.rubrics}
                onChange={handleChange}
                placeholder="Enter grading rubrics"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPoints">Maximum Points</Label>
              <Input
                id="maxPoints"
                name="maxPoints"
                type="number"
                value={formData.maxPoints}
                onChange={handleChange}
                min="1"
                max="1000"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Toaster />
    </div>
  )
}
