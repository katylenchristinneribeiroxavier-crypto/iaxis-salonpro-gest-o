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
- Reseller AI uses authenticated streaming server routes with request-local gateway helpers; qualification runs once during lead submission, never on page views, and preserves commission snapshots.
- Master access reuses protected user_roles rather than a parallel email-based role table; salon suspension is separate from billing and enforced by restrictive RLS with audited changes.
- Compose the unified salon page from existing operational modules; show subscription requests as owner-account history because they have no salon identifier.
- Resolve booking WhatsApp through the selected salon's owner-scoped configuracoes_salao row; expose only name and contact through a safe public function, never Evolution credentials.
- Evolution sends run in authenticated server functions; tenant webhooks authenticate a derived header token, persist sanitized events, and recover pending events on callbacks, sends, and inbox refresh.
- Central Evolution credentials are service-role-only after super_admin checks; provision stable salon-scoped instances through owner-authorized functions and resolve managed credentials only server-side to prevent cross-tenant access.
- Salon users have column-scoped access only to personal contact settings, never API credentials or instance controls; keep one super_admin enforced by a partial unique index and never grant it through self-signup.
- Support conversations reuse existing tickets; an authenticated transactional database function assigns authorship and developer status, and only the requester or super_admin may read the immutable history.
- Booking assistants use database slot availability and transactional booking to derive catalog prices, duration, timezone and deposit; never allow model output to write appointments.
- Reminder queues are generated idempotently from appointment/client changes; external delivery stays off until developer activation and uses managed authenticated scheduled callbacks with atomic claims and uncertain-send quarantine.
- Salon creation requires a confirmed purchase; a database singleton locks the developer-only free test redemption, and purchase timestamps preserve the seven-day trial separately from paid access.
- National licenses are provisioned transactionally from confirmed purchases; salon_access_allowed enforces expiry with master suspension preserved, and only authenticated super_admin RPCs may renew or block licenses. The root layout checks licensing without gating renewal or support.
- Staff portal /f/$token uses professionals.portal_token through security-definer RPCs (staff_portal, staff_change_appointment) so staff see only their own agenda and commission without login.
- Stock (suppliers/products/stock_movements) is salon-scoped via manages_salon; automatic deductions happen only in the appointment 'finalizado' trigger, deduplicated per appointment and product.

- Financial reports use authenticated salon-scoped RPCs and paid appointment commission snapshots in Brasília; receipt AI classifies items but deterministic database arithmetic owns totals and separate cash/purchased-stock versus consumed-stock views prevent duplicate costs.
- Receipt uploads use private salon-scoped storage, streamed request-local Responses extraction and content-hash deduplication; professional advances are reconciled against commissions rather than charged twice.
- Brazilian occasion dates use date-easter and statutory classifications; date-specific copy is deterministic, consent-scoped and queued idempotently by the existing developer-gated reminder worker, avoiding new AI spend and duplicate schedulers.
