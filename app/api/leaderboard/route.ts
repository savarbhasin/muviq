import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

import { Decimal } from '@prisma/client/runtime/library';

function convertBigIntAndDecimal(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Check for Prisma Decimal instance
  if (obj instanceof Decimal) {
    return obj.toNumber(); // or obj.toString() if you want more precision
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntAndDecimal);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntAndDecimal(obj[key]);
    }
    return result;
  }

  return obj;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // This is a single efficient query that:
    // 1. Joins students with their users to get names
    // 2. Joins with submissions to calculate average grades
    // 3. Orders by average grade and limits to top 5
    const rawTopStudents = await prisma.$queryRaw`
      SELECT 
        u.id as "userId",
        u.name as "studentName",
        COALESCE(AVG(s.grade), 0) as "averageGrade",
        COUNT(DISTINCT s.id) as "submissionCount"
      FROM 
        "Student" st
      JOIN 
        "User" u ON st."userId" = u.id
      LEFT JOIN 
        "Submission" s ON st.id = s."studentId"
      GROUP BY 
        u.id, u.name
      ORDER BY 
        "averageGrade" DESC
      LIMIT 5
    `;
    
    // Apply the conversion to the raw results
    const topStudents = convertBigIntAndDecimal(rawTopStudents);
    
    return NextResponse.json(topStudents);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}