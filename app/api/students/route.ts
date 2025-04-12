import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const students = await db.student.findMany();
    return NextResponse.json(students);
}
