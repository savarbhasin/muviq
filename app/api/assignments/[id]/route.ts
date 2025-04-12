import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/assignments/[id] - Get a specific assignment
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        project: true,
        _count: {
          select: { submissions: true }
        }
      }
    });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // If user is a professor, ensure they own the project
    if (user.role === 'Professor' && user.professor) {
      const project = await prisma.project.findFirst({
        where: {
          id: assignment.projectId,
          professorId: user.professor.id
        }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Not authorized to access this assignment' }, { status: 403 });
      }
    }
    
    // For students, include their submission if any
    if (user.role === 'Student' && user.student) {
      const submission = await prisma.submission.findFirst({
        where: {
          assignmentId: id,
          studentId: user.student.id
        }
      });
      
      return NextResponse.json({
        ...assignment,
        submission: submission || null,
        submitted: !!submission,
        status: submission ? (submission.grade !== null ? 'graded' : 'submitted') : 'pending'
      });
    }
    
    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

// PUT /api/assignments/[id] - Update an assignment (professor only)
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
      return NextResponse.json({ error: 'Only professors can update assignments' }, { status: 403 });
    }
    
    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        project: true
      }
    });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // Ensure project belongs to the professor
    const project = await prisma.project.findFirst({
      where: {
        id: assignment.projectId,
        professorId: user.professor.id
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Not authorized to update this assignment' }, { status: 403 });
    }
    
    const { name, description, rubrics, dueDate, maxPoints } = await req.json();
    
    if (!name || !dueDate) {
      return NextResponse.json({ error: 'Name and due date are required' }, { status: 400 });
    }
    
    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        name,
        description,
        rubrics,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100
      }
    });
    
    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

// DELETE /api/assignments/[id] - Delete an assignment (professor only)
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
      return NextResponse.json({ error: 'Only professors can delete assignments' }, { status: 403 });
    }
    
    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        project: true
      }
    });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }
    
    // Ensure project belongs to the professor
    const project = await prisma.project.findFirst({
      where: {
        id: assignment.projectId,
        professorId: user.professor.id
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Not authorized to delete this assignment' }, { status: 403 });
    }
    
    // Delete assignment (cascades to submissions)
    await prisma.assignment.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
