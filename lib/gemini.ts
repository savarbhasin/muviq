import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function gradeSubmission(submission: string, rubrics: string, maxPoints: number) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an AI grading assistant. Grade the following student submission based on the provided rubrics.
    
Rubrics:
${rubrics}

Student Submission:
${submission}

Please provide:
1. A numerical grade out of ${maxPoints}
2. Detailed feedback explaining the grade
Format your response as a JSON object with 'grade' and 'feedback' fields.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();
    
    // Try to extract JSON from the response if it's wrapped in backticks
    const jsonMatch = text.match(/```json\s*({[\s\S]*?})\s*```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    
    try {
      // Try to parse the AI response as JSON
      const parsed = JSON.parse(text);
      return {
        grade: Math.min(maxPoints, Math.max(0, Math.round(parsed.grade))), // Ensure grade is between 0-100
        feedback: parsed.feedback
      };
    } catch (e) {
      // If JSON parsing fails, try to extract grade and feedback from text
      const gradeMatch = text.match(/grade["\s:]+(\d+)/i);
      const grade = gradeMatch ? Math.min(maxPoints, Math.max(0, Math.round(Number(gradeMatch[1])))) : 0;
      
      return {
        grade,
        feedback: text
      };
    }
  } catch (error) {
    console.error("Error grading with Gemini:", error);
    throw error;
  }
}
