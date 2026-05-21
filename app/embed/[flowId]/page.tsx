import { notFound } from "next/navigation";
import { getFlow } from "@/lib/db/repositories/projects";
import { EmbedChat } from "@/components/embed/embed-chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ flowId: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function EmbedPage({ params, searchParams }: PageProps) {
  const { flowId } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t.trim() : "";

  const flow = await getFlow(flowId);
  if (!flow || !flow.embedEnabled || !flow.embedToken || token !== flow.embedToken) {
    notFound();
  }

  return (
    <div className="h-dvh min-h-[400px] w-full overflow-hidden bg-background">
      <EmbedChat flowId={flow.id} embedToken={flow.embedToken} flowName={flow.name} />
    </div>
  );
}
