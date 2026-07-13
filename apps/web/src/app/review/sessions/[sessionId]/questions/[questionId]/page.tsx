import { notFound } from "next/navigation";
import { getReviewGuidingQuestions, getReviewSession } from "@/api-client/client";
import { ReviewQuestionDetail } from "@/components/review/ReviewQuestionDetail";

type Props = {
  params: Promise<{ sessionId: string; questionId: string }>;
};

export default async function ReviewQuestionPage({ params }: Props) {
  const { sessionId, questionId } = await params;
  try {
    const [detail, questions] = await Promise.all([getReviewSession(sessionId), getReviewGuidingQuestions(sessionId)]);
    const question = questions.find((item) => item.id === questionId);
    if (!question) {
      notFound();
    }
    return <ReviewQuestionDetail question={question} session={detail.session} />;
  } catch {
    notFound();
  }
}
