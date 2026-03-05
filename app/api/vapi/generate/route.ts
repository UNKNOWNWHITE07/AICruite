import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  console.log("POST /api/interview triggered");

  try {
    const body = await request.json();

    const { type, role, level, techstack, amount, userid } = body;

    console.log("Incoming request:", body);

    // Generate interview questions
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `
Prepare questions for a job interview.

Role: ${role}
Experience level: ${level}
Tech stack: ${techstack}
Focus type: ${type}
Number of questions: ${amount}

Return ONLY a JSON array like:
["Question 1","Question 2","Question 3"]

Do not include extra text.
Avoid special characters like / * etc.
`,
    });

    console.log("AI Raw Output:", text);

    let parsedQuestions;

    try {
      parsedQuestions = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Failed:", parseError);

      return Response.json(
        { success: false, error: "AI returned invalid question format" },
        { status: 500 }
      );
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions: parsedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    console.log("Saving interview to Firestore...");

    const docRef = await db.collection("interviews").add(interview);

    console.log("Interview created:", docRef.id);

    return Response.json({
      success: true,
      interviewId: docRef.id,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return Response.json(
      { success: false, error: "Failed to create interview" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      success: true,
      message: "Interview API working",
    },
    { status: 200 }
  );
}