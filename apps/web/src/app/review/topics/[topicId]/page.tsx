import { notFound } from "next/navigation";
import { ensureCurrentReviewSession, getReviewSessionsForTopic, getTopic } from "@/api-client/client";
import { ReviewTopicDetail } from "@/components/review/ReviewTopicDetail";

type Props = {
  params: Promise<{ topicId: string }>;
};

export default async function ReviewTopicPage({ params }: Props) {
  const { topicId } = await params;
  try {
    const [topic, currentSession] = await Promise.all([getTopic(topicId), ensureCurrentReviewSession(topicId)]);
    const sessions = await getReviewSessionsForTopic(topicId);
    return <ReviewTopicDetail currentSession={currentSession.session} sessions={sessions} topic={topic} />;
  } catch {
    notFound();
  }
}
