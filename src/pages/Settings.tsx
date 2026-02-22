import { Settings as SettingsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </div>
      
      <Card className="p-12">
        <CardContent className="flex flex-col items-center justify-center text-center p-0">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <SettingsIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            Profile settings, currency selection, theme toggle, and notification preferences will be available in the next update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
