import { notFound } from "next/navigation";
import {
  getProject,
  listFlowsForProject,
  getStartFlow,
} from "@/lib/db/repositories/projects";
import { AppNav } from "@/components/layout/app-nav";
import { ProjectSettingsForm } from "@/components/projects/project-settings";
import { FlowList } from "@/components/projects/flow-list";
import { KbManager } from "@/components/projects/kb-manager";
import { ExportProjectButton } from "@/components/projects/export-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();
  const [flows, startFlow] = await Promise.all([
    listFlowsForProject(projectId),
    getStartFlow(projectId),
  ]);
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.description || "No description"}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportProjectButton projectId={project.id} />
            {startFlow ? (
              <Button asChild>
                <Link href={`/projects/${project.id}/flows/${startFlow.id}`}>
                  Open builder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="flows">
          <TabsList>
            <TabsTrigger value="flows">Flows</TabsTrigger>
            <TabsTrigger value="settings">Agent settings</TabsTrigger>
            <TabsTrigger value="kb">Knowledge base</TabsTrigger>
          </TabsList>
          <TabsContent value="flows" className="pt-4">
            <FlowList projectId={projectId} flows={flows} />
          </TabsContent>
          <TabsContent value="settings" className="pt-4">
            <ProjectSettingsForm project={project} />
          </TabsContent>
          <TabsContent value="kb" className="pt-4">
            <KbManager projectId={projectId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
