import { notFound } from "next/navigation";
import { getReviewGuidingQuestions, getReviewSession, getReviewSessionInputs } from "@/api-client/client";
import { ReviewSessionDetail } from "@/components/review/ReviewSessionDetail";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReviewSessionPage({ params }: Props) {
  const { sessionId } = await params;
  try {
    const [detail, inputs, questions] = await Promise.all([
      getReviewSession(sessionId),
      getReviewSessionInputs(sessionId),
      getReviewGuidingQuestions(sessionId)
    ]);
    return <ReviewSessionDetail detail={detail} initialInputs={inputs} initialQuestions={questions} />;
  } catch {
    notFound();
  }
}
