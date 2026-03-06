import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  console.log("POST /api/interview triggered");

  try {
    const body = await request.json();

    console.log("Incoming request:", body);

    const { type, role, level, techstack, amount, userid } = body;

    /* Validate required data */
    if (!role || !level || !type || !amount || !userid) {
      console.error("Missing required interview parameters");

      return Response.json(
        { success: false, error: "Missing interview parameters" },
        { status: 400 }
      );
    }

    /* Safely parse tech stack */
    const stack =
      typeof techstack === "string"
        ? techstack.split(",").map((t: string) => t.trim())
        : [];

    /* Generate interview questions */
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `
You are an expert technical interviewer.

Your task is to generate interview questions based ONLY on the information provided.

Role: ${role}
Experience Level: ${level}
Focus Type: ${type}
Tech Stack: ${stack.join(", ")}

Rules:

* Questions MUST relate to the provided tech stack.
* If the focus type is "technical", generate technical questions about the tech stack.
* If the focus type is "behavioral", generate behavioral interview questions (no technical topics).
* DO NOT ask questions about technologies not listed in the tech stack.
* Do NOT include React, Next.js, or TypeScript unless they are in the tech stack.
* Keep questions clear and realistic for a real job interview.

Number of questions: ${amount}

Return ONLY a valid JSON array like this:
["Question 1","Question 2","Question 3"]

Do not include explanations or extra text.
`,
    });

    console.log("AI Raw Output:", text);

    let parsedQuestions;

    try {
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsedQuestions = JSON.parse(cleanedText);
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
      techstack: stack,
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
      { success: false, error: "Failed to create interview, sorry" },
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