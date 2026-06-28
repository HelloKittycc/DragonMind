import { getNode } from "@/api-client/client";
import { formatFullDate } from "@/api-client/display";
import { toPossiblePatternDisplayModel } from "@/api-client/single-focus";
import { MobileShell } from "@/components/single-focus/MobileShell";
import { PossiblePatternScreen } from "@/components/single-focus/PossiblePatternScreen";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PossiblePatternPage({ params }: Props) {
  const { id } = await params;
  const detail = await getNode(id);
  const model = toPossiblePatternDisplayModel(detail);

  return (
    <MobileShell dateText={formatFullDate()}>
      <PossiblePatternScreen model={model} />
    </MobileShell>
  );
}
