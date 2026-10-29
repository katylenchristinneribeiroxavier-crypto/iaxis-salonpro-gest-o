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

- Reuse existing salon entities and add modules through additive migrations to preserve account and referral links.
- Protect salon modules with database-scoped salon_members and manages_salon; UI gates never grant privileges.
- Share deterministic salon rules in salon-rules.ts and persist commission snapshots in a transactional appointment trigger.
- App-internal privileged work uses TanStack server functions; external callbacks use verified /api/public endpoints.
