import type { MessageRecord } from "@/api-client/types";
import { messageMeta } from "@/api-client/display";

type Props = {
  messages: MessageRecord[];
};

export function MessageTimeline({ messages }: Props) {
  return (
    <section className="panel stack">
      <div>
        <p className="section-kicker">Cognitive Timeline</p>
        <h2>认知时间线</h2>
      </div>
      {messages.length === 0 ? (
        <p className="muted">暂时没有记录。</p>
      ) : (
        messages.map((message) => (
          <article className="message" key={message.id}>
            <div className="message-meta">
              {messageMeta(message)}
            </div>
            <div>{message.content}</div>
          </article>
        ))
      )}
    </section>
  );
}
