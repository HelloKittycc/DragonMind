CREATE UNIQUE INDEX IF NOT EXISTS idx_review_session_unique_topic_period
ON review_session (primary_topic_id, period_start, period_end);
