import { getWorkspaceNodes } from "@/api-client/client";
import { KnowledgeEvidenceWorkspace } from "@/components/knowledge/KnowledgeEvidenceWorkspace";

export default async function KnowledgePage() {
  const nodes = await getWorkspaceNodes("all");

  return <KnowledgeEvidenceWorkspace nodes={nodes} />;
}
