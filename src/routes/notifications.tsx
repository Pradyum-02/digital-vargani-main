import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markAllNotificationsRead, useAppData } from "@/services/store";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, SectionCard } from "@/components/app/ui-bits";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Activity & Audit Log — Digital Vargani" },
      {
        name: "description",
        content: "Notifications for every collection and expense, plus a full audit trail of Mandal actions.",
      },
      { property: "og:title", content: "Activity & Audit Log — Digital Vargani" },
      { property: "og:description", content: "Who did what, and when — complete Mandal transparency." },
    ],
  }),
  component: NotificationsPage,
});

const TYPE_STYLES: Record<string, string> = {
  COLLECTION: "bg-success/12 text-success border-success/25",
  EXPENSE: "bg-secondary/12 text-secondary border-secondary/25",
  REMINDER: "bg-warning/15 text-warning-foreground border-warning/40",
  PAUTI: "bg-primary/12 text-primary border-primary/25",
};

function NotificationsPage() {
  const data = useAppData();
  const notifications = data.notifications.slice().sort((a, b) => b.date.localeCompare(a.date));
  const logs = data.auditLogs.slice().sort((a, b) => b.date.localeCompare(a.date));
  const unread = notifications.filter((n) => !n.read).length;
  const userName = (id: string) => data.collectors.find((c) => c.id === id)?.name ?? "System";

  return (
    <>
      <PageHeader
        title="Activity"
        marathi="सूचना"
        description={`${unread} unread notifications · ${logs.length} audit entries`}
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              onClick={() => {
                markAllNotificationsRead();
                toast.success("All notifications marked read");
              }}
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : null
        }
      />

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4" /> Audit log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4">
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title="No notifications yet"
              description="Collections, Pautis and expenses will appear here as your team records them."
            />
          ) : (
            <SectionCard title="Recent notifications">
              <div className="space-y-2">
                {notifications.slice(0, 80).map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-3 ${n.read ? "" : "bg-accent/40"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            TYPE_STYLES[n.type] ?? "border-border"
                          }`}
                        >
                          {n.type}
                        </span>
                        <p className="text-sm font-semibold">{n.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.date)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          {logs.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title="No audit entries yet"
              description="Every create, edit and void action is recorded here with the user and timestamp."
            />
          ) : (
            <SectionCard title="Audit trail" marathi="नोंद इतिहास">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs tracking-wide uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2">When</th>
                      <th className="py-2">User</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">Entity</th>
                      <th className="py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 120).map((l) => (
                      <tr key={l.id} className="border-t align-top">
                        <td className="py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(l.date)}</td>
                        <td className="py-2 whitespace-nowrap">{userName(l.userId)}</td>
                        <td className="py-2 font-medium">{l.action}</td>
                        <td className="py-2 text-muted-foreground">{l.entity}</td>
                        <td className="py-2 text-xs text-muted-foreground">{l.after ?? l.before ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
