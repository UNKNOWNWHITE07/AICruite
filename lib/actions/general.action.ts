"use server";

import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

import { db } from "@/firebase/admin";

/* -----------------------------
   CREATE FEEDBACK
------------------------------*/
export async function createFeedback(params: CreateFeedbackParams) {
  console.log("createFeedback called with:", params);

  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    if (!interviewId || !userId) {
      console.error("Missing interviewId or userId");
      return { success: false };
    }

    /* Remove system messages */
    const filteredTranscript = transcript.filter(
      (msg) => msg.role === "user" || msg.role === "assistant"
    );

    const formattedTranscript = filteredTranscript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    console.log("Formatted Transcript:", formattedTranscript);

    /* Ask AI for JSON feedback */
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `
You are an AI interviewer evaluating a candidate.

Transcript:
${formattedTranscript}

Return ONLY valid JSON in this format. Do NOT wrap the JSON in markdown or code blocks.

{
  "totalScore": number,
  "categoryScores": {
    "communication": number,
    "technical": number,
    "problemSolving": number,
    "cultureFit": number,
    "confidence": number
  },
  "strengths": string[],
  "areasForImprovement": string[],
  "finalAssessment": string
}
`,
    });

    let parsed;

    try {
      // Clean AI response if wrapped in markdown code blocks
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error("AI JSON parse failed:", text);
      return { success: false };
    }

    /* Build Firestore document */
    const feedback = {
      interviewId,
      userId,
      totalScore: parsed?.totalScore ?? 0,
      categoryScores: parsed?.categoryScores ?? {},
      strengths: parsed?.strengths ?? [],
      areasForImprovement: parsed?.areasForImprovement ?? [],
      finalAssessment: parsed?.finalAssessment ?? "",
      createdAt: new Date().toISOString(),
    };

    console.log("Saving feedback to Firestore:", feedback);

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

/* -----------------------------
   GET INTERVIEW BY ID
------------------------------*/
export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  if (!interview.exists) return null;

  return {
    id: interview.id,
    ...interview.data(),
  } as Interview;
}

/* -----------------------------
   GET FEEDBACK BY INTERVIEW
------------------------------*/
export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];

  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

/* -----------------------------
   GET LATEST INTERVIEWS
------------------------------*/
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .where("userId", "!=", userId)
    .where("finalized", "==", true)
    .orderBy("userId")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

/* -----------------------------
   GET USER INTERVIEWS
------------------------------*/
export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}