import { getNode } from "@/api-client/client";
import { formatFullDate } from "@/api-client/display";
import { toJudgmentDisplayModel } from "@/api-client/single-focus";
import { JudgmentScreen } from "@/components/single-focus/JudgmentScreen";
import { MobileShell } from "@/components/single-focus/MobileShell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JudgePage({ params }: Props) {
  const { id } = await params;
  const detail = await getNode(id);
  const model = toJudgmentDisplayModel(detail);

  return (
    <MobileShell dateText={formatFullDate()}>
      <JudgmentScreen model={model} />
    </MobileShell>
  );
}
