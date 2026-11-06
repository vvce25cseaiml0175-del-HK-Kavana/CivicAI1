<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## CivicAI architecture
- UI components call only `src/lib/api/client.ts`; it targets the Django REST API when `VITE_CIVIC_API_URL` is set, else a browser demo store. Why: backend and Python AI engine plug in without touching components.
- Seeded demo records carry `simulated: true` and must render a SIMULATED badge. Why: never present sample data as live records.
- Auth calls live only in `src/lib/api/auth.ts` (Django `/auth/*` JWT endpoints); pages pass `role` to `AppShell`, which gates via `RoleGate`. Why: no fake auth — demo mode only labels open access as demonstration.
- Role gating is client-side UI only; Django must enforce permissions on every endpoint. Why: route guards don't protect APIs.
- Inspection submissions and admin review use separate client service operations and persisted report records; only review changes official inspection status. Why: inspector evidence and administrator approval must remain separate.
- Demo store changes notify query consumers in the current window and other tabs; migrate existing demo records in place. Why: all dashboards share updates without losing existing complaint or priority fields.
