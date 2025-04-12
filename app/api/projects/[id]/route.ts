import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/projects/[id] - Get a specific project
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        professor: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        assignments: {
          include: {
            _count: {
              select: { submissions: true }
            }
          }
        }
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // If user is a professor, ensure they own the project
    if (user.role === 'Professor' && user.professor && project.professorId !== user.professor.id) {
      return NextResponse.json({ error: 'Not authorized to access this project' }, { status: 403 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update a project (professor only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if user is a professor
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || !user.professor || user.role !== 'Professor') {
      return NextResponse.json({ error: 'Only professors can update projects' }, { status: 403 });
    }
    
    // Check if project exists and belongs to the professor
    const project = await prisma.project.findFirst({
      where: {
        id,
        professorId: user.professor.id
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found or not authorized' }, { status: 404 });
    }
    
    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description
      }
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project (professor only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if user is a professor
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || !user.professor || user.role !== 'Professor') {
      return NextResponse.json({ error: 'Only professors can delete projects' }, { status: 403 });
    }
    
    // Check if project exists and belongs to the professor
    const project = await prisma.project.findFirst({
      where: {
        id,
        professorId: user.professor.id
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found or not authorized' }, { status: 404 });
    }
    
    // Delete project (cascades to assignments and submissions)
    await prisma.project.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
