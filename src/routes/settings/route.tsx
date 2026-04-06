import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "./SettingsLayout";
import Header from "#/components/Header";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (<>
    <Header/>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <SettingsLayout />
    </div>
    </>
  );
}

