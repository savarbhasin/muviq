import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, Project } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/projects - Get all projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let projects: Project[] = [];
    
    // If professor, get their projects
    if (user.role === 'Professor' && user.professor) {
      projects = await prisma.project.findMany({
        where: { professorId: user.professor.id },
        include: {
          assignments: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { submissions: true }
              }
            }
          }
        }
      });
    } 
    // If student, get all projects (in a real app, you'd filter by enrollment)
    else if (user.role === 'Student') {
      projects = await prisma.project.findMany({
        include: {
          assignments: {
            select: {
              id: true,
              name: true,
              dueDate: true
            }
          }
        }
      });
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project (professor only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
   
    // Check if user is a professor
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || !user.professor || user.role !== 'Professor') {
      return NextResponse.json({ error: 'Only professors can create projects' }, { status: 403 });
    }
    
    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    // Create new project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        professorId: user.professor.id
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
