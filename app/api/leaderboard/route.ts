// ./app/api/leaderboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * Recursively converts BigInt and Prisma.Decimal
 * into JSON-serializable numbers.
 */
function convertBigIntAndDecimal(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (obj instanceof Prisma.Decimal) {
    return obj.toNumber(); // use toString() if precision matters
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

    /**
     * Fetch top 5 students by average grade
     */
    const rawTopStudents = await prisma.$queryRaw<
      {
        userId: string;
        studentName: string | null;
        averageGrade: Prisma.Decimal;
        submissionCount: bigint;
      }[]
    >`
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

    const topStudents = convertBigIntAndDecimal(rawTopStudents);

    return NextResponse.json(topStudents);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
