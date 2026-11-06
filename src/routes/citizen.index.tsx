
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/civic/AppShell";
import { ComplaintCard, Panel } from "@/components/civic/parts";
import { useComplaints, useRefresh } from "@/lib/api/hooks";
import { confirmComplaint } from "@/lib/api/client";

export const Route = createFileRoute("/citizen/")({
  head: () => ({
    meta: [
      { title: "Citizen dashboard – CivicAI" },
      {
        name: "description",
        content:
          "Track your civic complaints and confirm issues reported by your community.",
      },
      { property: "og:title", content: "Citizen dashboard – CivicAI" },
      {
        property: "og:description",
        content: "Track and confirm civic infrastructure complaints.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CitizenDash,
});

function CitizenDash() {
  const { data = [], isLoading } = useComplaints();
  const refresh = useRefresh();

  // Complaints submitted by the current citizen
  const mine = data.filter((c) => !c.simulated);

  // Only other citizens' unresolved complaints are shown here.
  const mineIds = new Set(mine.map((c) => c.id));

  const community = data.filter(
    (c) =>
      c.simulated &&
      !mineIds.has(c.id) &&
      c.status !== "resolved"
  );

  return (
    <AppShell role="citizen">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Citizen</p>
          <h1 className="text-3xl font-bold">Namaste 🙏</h1>
        </div>

        <Link
          to="/citizen/new"
          className="rounded-lg bg-saffron px-4 py-2.5 font-semibold text-saffron-foreground"
        >
          + New complaint
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="My complaints">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading…
            </p>
          ) : mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't filed any complaints yet.
            </p>
          ) : (
            <div className="space-y-3">
              {mine.map((c) => (
                <ComplaintCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Community confirmation">
          <p className="mb-3 text-xs text-muted-foreground">
            Seen the same problem? Confirm complaints reported by other
            citizens to raise their priority.
          </p>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading…
            </p>
          ) : community.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No community complaints available for confirmation.
            </p>
          ) : (
            <div className="space-y-3">
              {community.map((c) => (
                <ComplaintCard key={c.id} c={c}>
                  {c.confirmedByMe ? (
                    <p className="text-sm font-medium text-green-700">
                      ✓ You confirmed this complaint
                    </p>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await confirmComplaint(c.id);
                          refresh();
                        } catch (error) {
                          alert(
                            error instanceof Error
                              ? error.message
                              : "Unable to confirm complaint."
                          );
                        }
                      }}
                      className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
                    >
                      👍 I see this too
                    </button>
                  )}
                </ComplaintCard>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
