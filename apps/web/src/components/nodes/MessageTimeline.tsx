import type { MessageRecord } from "@/api-client/types";

type Props = {
  messages: MessageRecord[];
};

export function MessageTimeline({ messages }: Props) {
  return (
    <section className="panel stack">
      <h2>Messages</h2>
      {messages.length === 0 ? (
        <p className="muted">No messages yet.</p>
      ) : (
        messages.map((message) => (
          <article className="message" key={message.id}>
            <div className="message-meta">
              {message.role} · {message.message_type} · {message.created_at}
            </div>
            <div>{message.content}</div>
          </article>
        ))
      )}
    </section>
  );
}
