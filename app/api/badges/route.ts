import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/badges - Get all badges for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.student) {
      return NextResponse.json({ error: 'Only students can have badges' }, { status: 403 });
    }
    
    // Get badges for the student
    const badges = await prisma.badge.findMany({
      where: { studentId: user.student.id }
    });
    
    return NextResponse.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  }
}

// POST /api/badges - Award a new badge to a student (professor only)
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
      return NextResponse.json({ error: 'Only professors can award badges' }, { status: 403 });
    }
    
    const { studentId, name } = await req.json();
    
    if (!studentId || !name) {
      return NextResponse.json({ error: 'Student ID and badge name are required' }, { status: 400 });
    }
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Create new badge
    const badge = await prisma.badge.create({
      data: {
        name,
        studentId
      }
    });
    
    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 });
  }
}
