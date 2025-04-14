import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

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
      return NextResponse.json({ error: 'Only professors can award badges' }, { status: 403 });
    }
    
    const { studentId } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Check if student already has the Collaborator badge
    const existingBadge = await prisma.badge.findFirst({
      where: {
        studentId,
        name: 'Collaborator'
      }
    });
    
    if (existingBadge) {
      return NextResponse.json({ error: 'Student already has the Collaborator badge' }, { status: 400 });
    }
    
    // Create new Collaborator badge
    const badge = await prisma.badge.create({
      data: {
        name: 'Collaborator',
        studentId
      }
    });
    
    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Error awarding Collaborator badge:', error);
    return NextResponse.json({ error: 'Failed to award Collaborator badge' }, { status: 500 });
  }
}
