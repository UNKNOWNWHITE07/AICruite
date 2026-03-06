"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("");

  const assistantData = useRef<any>(null);
  const actionTriggered = useRef(false);

  /* -------------------------
     VAPI EVENTS
  -------------------------- */

  useEffect(() => {
    const onCallStart = () => {
      console.log("CALL STARTED");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = (data: any) => {
      console.log("CALL ENDED");
      console.log("FULL CALL DATA:", data);
      console.log("FULL CALL DATA:", data);
      console.log("ASSISTANT VARIABLES:", assistantData.current);
      assistantData.current =
        data?.variable_values ||
        data?.variables ||
        data?.call?.variable_values ||
        {};

      console.log("ASSISTANT VARIABLES:", assistantData.current);

      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: Error) => {
      console.log("VAPI ERROR:", error);
    };

    vapi.on("call-start", onCallStart as any);
    vapi.on("call-end", onCallEnd as any);
    vapi.on("message", onMessage as any);
    vapi.on("speech-start", onSpeechStart as any);
    vapi.on("speech-end", onSpeechEnd as any);
    vapi.on("error", onError as any);

    return () => {
      vapi.off("call-start", onCallStart as any);
      vapi.off("call-end", onCallEnd as any);
      vapi.off("message", onMessage as any);
      vapi.off("speech-start", onSpeechStart as any);
      vapi.off("speech-end", onSpeechEnd as any);
      vapi.off("error", onError as any);
    };
  }, []);

  /* -------------------------
     LAST MESSAGE DISPLAY
  -------------------------- */

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  /* -------------------------
     AFTER CALL FINISHES
  -------------------------- */

  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED) return;
    if (actionTriggered.current) return;

    actionTriggered.current = true;

    /* -------------------------
       GENERATE INTERVIEW
    -------------------------- */

    if (type === "generate") {
      const generateInterview = async () => {
        try {
          const { role, techstack, type: interviewType, level, amount } =
            assistantData.current || {};

          console.log("VOICE DATA:", assistantData.current);

          const res = await fetch("/api/vapi/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              role,
              techstack,
              type: interviewType,
              level,
              amount,
              userid: userId,
            }),
          });

          const data = await res.json();

          if (data.success) {
            router.push(`/interview/${data.interviewId}`);
          } else {
            router.push("/");
          }
        } catch (error) {
          console.error("Interview generation error:", error);
        }
      };

      generateInterview();
    }

    /* -------------------------
       GENERATE FEEDBACK
    -------------------------- */

    else {
      const generateFeedback = async () => {
        try {
          if (!interviewId || !userId) return;
          if (messages.length === 0) return;

          const { success, feedbackId: id } = await createFeedback({
            interviewId,
            userId,
            transcript: messages,
            feedbackId,
          });

          if (success && id) {
            router.push(`/interview/${interviewId}/feedback`);
          } else {
            router.push("/");
          }
        } catch (error) {
          console.error("Feedback generation error:", error);
        }
      };

      generateFeedback();
    }
  }, [callStatus]);

  /* -------------------------
     START CALL
  -------------------------- */

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      const safeUserName = userName || "there";

      const assistantId =
        process.env.NEXT_PUBLIC_VAPI_SETUP_ASSISTANT_ID as string;

      if (!assistantId) {
        console.error("Setup Assistant ID missing");
        return;
      }

      console.log("SETUP ASSISTANT:", assistantId);

      await vapi.start(assistantId, {
        variableValues: {
          username: safeUserName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";

      if (questions) {
        formattedQuestions = questions.map((q) => `- ${q}`).join("\n");
      }

      const interviewAssistantId =
        process.env.NEXT_PUBLIC_VAPI_INTERVIEW_ASSISTANT_ID as string;

      if (!interviewAssistantId) {
        console.error("Interview Assistant ID missing");
        return;
      }

      console.log("INTERVIEW ASSISTANT:", interviewAssistantId);

      await vapi.start(interviewAssistantId, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    console.log("Stopping call...");
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />

            {isSpeaking && <span className="animate-speak" />}
          </div>

          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />

            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : "..."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;