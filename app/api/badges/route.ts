import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import {groupBy} from 'lodash';
const prisma = new PrismaClient();


function convertBigIntAndDecimal(data: any) {
  return data.map((item: any) => {
    const converted: any = {};
    for (const key in item) {
      const val = item[key];
      if (typeof val === 'bigint') {
        converted[key] = Number(val);
      } else if (key === 'awardedDate' && typeof val === 'string' && !isNaN(Date.parse(val))) {
        converted[key] = new Date(val);
      } else {
        converted[key] = val;
      }
    }
    return converted;
  });
}



export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { student: true, professor: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const showAll = req.nextUrl.searchParams.get('all') === 'true';
    
    if (showAll) {
      if (user.role !== 'Professor' || !user.professor) {
        return NextResponse.json({ error: 'Only professors can view all student badges' }, { status: 403 });
      }
      
      const rawStudentsWithBadges = await prisma.$queryRaw`
        SELECT 
          u.id as userId,
          u.name as studentName,
          b.name as badgeName,
          b."awardedDate" as awardedDate
        FROM 
          "Badge" b
        JOIN 
          "Student" s ON b."studentId" = s.id
        JOIN 
          "User" u ON s."userId" = u.id
        ORDER BY 
          u.name, b."awardedDate" DESC
      `;
      
      const studentsWithBadges = convertBigIntAndDecimal(rawStudentsWithBadges);
      console.log(studentsWithBadges);
      return NextResponse.json(studentsWithBadges);
    } else {
      if (!user.student) {
        return NextResponse.json({ error: 'Only students can have badges' }, { status: 403 });
      }
      
      const badges = await prisma.badge.findMany({
        where: { studentId: user.student.id },
        orderBy: { awardedDate: 'desc' }
      });
      return NextResponse.json(badges);
    }
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
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
      return NextResponse.json({ error: 'Only professors can award badges' }, { status: 403 });
    }
    
    const { studentId, name } = await req.json();
    
    if (!studentId || !name) {
      return NextResponse.json({ error: 'Student ID and badge name are required' }, { status: 400 });
    }
    
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
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
