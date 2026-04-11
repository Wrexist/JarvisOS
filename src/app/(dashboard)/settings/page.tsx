import { Separator } from "@/components/ui/separator";
import { TemplateList } from "@/components/settings/template-list";
import { ClaudeMdGenerator } from "@/components/settings/claude-md-generator";
import { HooksTemplate } from "@/components/settings/hooks-template";
import { WebhookConfig } from "@/components/settings/webhook-config";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Workspace configuration, templates, and integrations.
        </p>
      </div>

      <TemplateList />

      <Separator />

      <WebhookConfig />

      <Separator />

      <ClaudeMdGenerator />

      <Separator />

      <HooksTemplate />
    </div>
  );
}
