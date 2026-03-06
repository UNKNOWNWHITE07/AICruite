import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  const categoryScores = feedback?.categoryScores ?? {};
  const categoryFeedback = (feedback as any)?.categoryFeedback ?? {};

  const categoryEntries = Object.entries(categoryScores) as [
    string,
    number
  ][];

  return (
    <section className="section-feedback">
      {/* Title */}
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      {/* Score + Date */}
      <div className="flex flex-row justify-center mt-4">
        <div className="flex flex-row gap-5">
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore ?? 0}
              </span>
              /100
            </p>
          </div>

          <div className="flex flex-row gap-2 items-center">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Overall AI Feedback */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Overall Assessment</h2>

        <p className="text-gray-300 leading-relaxed">
          {feedback?.finalAssessment ?? "Feedback is being generated..."}
        </p>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-6 mt-6">
        <h2 className="text-xl font-semibold">Breakdown of the Interview</h2>

        {categoryEntries.map(([name, score], index) => (
          <div key={index} className="flex flex-col gap-1">
            <p className="font-bold capitalize">
              {index + 1}. {name} ({score}/100)
            </p>

            <p className="text-gray-300 leading-relaxed">
              {categoryFeedback?.[name] ?? ""}
            </p>
          </div>
        ))}
      </div>

      {/* Strengths */}
      <div className="flex flex-col gap-3 mt-6">
        <h3 className="text-lg font-semibold">Strengths</h3>

        <ul className="list-disc ml-5">
          {feedback?.strengths?.map((strength: string, index: number) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div className="flex flex-col gap-3 mt-6">
        <h3 className="text-lg font-semibold">Areas for Improvement</h3>

        <ul className="list-disc ml-5">
          {feedback?.areasForImprovement?.map(
            (area: string, index: number) => (
              <li key={index}>{area}</li>
            )
          )}
        </ul>
      </div>

      {/* Buttons */}
      <div className="buttons mt-8">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;