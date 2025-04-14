import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();
 
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let whereClause = {};
    
    if (projectId) {
      whereClause = {
        projectId
      };
      
      if (user.role === 'Professor' && user.professor) {
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            professorId: user.professor.id
          }
        });
        
        if (!project) {
          return NextResponse.json({ error: 'Project not found or not authorized' }, { status: 404 });
        }
      }
    } else if (user.role === 'Professor' && user.professor) {
      whereClause = {
        project: {
          professorId: user.professor.id
        }
      };
    }
    
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    if (user.role === 'Student' && user.student) {
      const assignmentsWithSubmissionStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await prisma.submission.findFirst({
            where: {
              assignmentId: assignment.id,
              studentId: user.student!.id
            }
          });
          
          return {
            ...assignment,
            submitted: !!submission,
            submissionId: submission?.id || null,
            grade: submission?.grade || null,
            status: submission ? (submission.grade !== null ? 'graded' : 'submitted') : 'pending'
          };
        })
      );
      
      return NextResponse.json(assignmentsWithSubmissionStatus);
    }
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || !user.professor || user.role !== 'Professor') {
      return NextResponse.json({ error: 'Only professors can create assignments' }, { status: 403 });
    }
    
    const { name, description, rubrics, dueDate, maxPoints, projectId } = await req.json();
    
    if (!name || !dueDate || !projectId) {
      return NextResponse.json({ error: 'Name, due date, and project ID are required' }, { status: 400 });
    }
    
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        professorId: user.professor.id
      }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found or not authorized' }, { status: 404 });
    }
    
    const assignment = await prisma.assignment.create({
      data: {
        name,
        description,
        rubrics,
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        projectId
      }
    });
    
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
