# PRD: BSC Control Tower

**Status:** Draft

**Product:** Governed collaboration control tower for BSC form workflows

**Primary substrate:** Google Drive and native Google Sheets

**Primary file ownership model:** Single connected personal Google account via OAuth for the prototype

**Audience:** Product, engineering, demo operators, and future maintainers

## Summary

BSC form workflows often happen in spreadsheets, while coordination happens through email, chat, and meetings. That makes it hard for coordinators to know which form is being drafted, which version is under review, who requested changes, what was approved, and what evidence exists for audit.

BSC Control Tower is a web application that keeps the working surface in Google Sheets while moving governance into a structured application. Participants continue editing familiar spreadsheet files in Google Drive. The control tower owns role-aware access, lifecycle actions, versioned review copies, immutable snapshots, deterministic diffs, generated notification drafts, and an append-only event log.

The product thesis is simple: do not replace spreadsheets. Make spreadsheet-based work governable.

## Goals

- Support a complete BSC form lifecycle: drafting, submission, review, requested changes, resubmission, and approval.
- Use Google Drive and native Google Sheets as the first spreadsheet substrate.
- Let the prototype run without a Google Workspace business account or service account.
- Use one connected personal Google account, authorized through OAuth, to create and operate Drive/Sheets files.
- Preserve deterministic governance through app-side role checks, valid phase transitions, snapshots, and events.
- Keep file operations behind a substrate interface so future implementations can support other file providers.
- Keep OAuth scopes narrow enough for a practical prototype.

## Non-Goals

- Replacing Google Sheets with an in-app spreadsheet editor.
- Using service-account ownership.
- Using Google Workspace domain-wide delegation.
- Implementing production-grade enterprise identity.
- Mirroring every participant through per-user delegated Google OAuth.
- Sending email directly by default.
- Supporting multi-exercise tenancy.
- Making autonomous agent decisions.

## Users And Roles

### Admin

The admin coordinates the exercise. They need to create forms, monitor form status, inspect form details, download snapshots.

For the prototype, the admin also connects the Google account used by the server to create and operate Drive/Sheets files.

### PIC

The PIC owns one form that is represented in a google sheet. They edit the workspace Google Sheet, inspect a pre-submit preview in the control tower, and submit or resubmit the form for review.

### Reviewer

The reviewer inspects submitted form versions, reviews diffs, writes comments, requests changes, or approves the form.

### Connected Google Account

The connected Google account is the OAuth identity used by the server for Google file operations: copying templates, creating folders or files, updating Sheets, sharing files, exporting snapshots, and applying protected ranges.

In the prototype, this account is expected to be the coordinator or developer's personal Google account. It is not the same thing as the app user who is taking a governance action.

### System Agents

The system may use narrow AI helpers:

- A draft writer that creates notification subject/body text.
- A diff summarizer that turns deterministic cell diffs into concise business-language bullets.
- A validation agent to ensure business logic is adhered to in forms - for example max score <=100. 
- A setup assistant that explains form setup changes and requires admin approval before mutating files or records.

Agents are advisory. They cannot approve forms, bypass role checks, or mutate lifecycle state directly.

## Core Concepts

### Form

A form is the governed unit of work. Each form has a name, assigned PIC, assigned reviewers, it is represented as a workspace Google Sheet, optional latest for-review copy, latest submitted version, and event history.

### Workspace Sheet

The workspace sheet is the editable Google Sheet used by the PIC during drafting and revision.

### For-Review Copy

The for-review copy is a versioned Google Sheet copy created on submission. Reviewers inspect the for-review copy rather than a moving workspace target.

### Snapshot

A snapshot is an immutable exported file capture tied to a governance action. Snapshots are stored privately, hashed with SHA-256, and available only to admins through short-lived download links.

### Event

An event is an append-only audit record. Terminal governance events determine form phase. Non-terminal events document setup, authentication, drafts, connected-account changes, and failures.

## OAuth And Google File Ownership

The prototype uses one connected personal Google account.

Requirements:

- Admins can connect a Google account through OAuth.
- The OAuth flow requests offline access so the server can refresh access tokens.
- Refresh tokens are encrypted at rest.
- The app stores connected-account metadata: account email, provider, granted scopes, token expiry, revocation status, last successful use, and last error.
- The app exposes reconnect when tokens expire, are revoked, or lack required scopes.
- Files created by the app are owned by the connected Google account.
- App authorization determines whether an actor can submit, request changes, approve, or download snapshots.
- Google Drive permissions are operational controls for opening and editing files; they are not the source of truth for governance state.

Preferred prototype scopes:

- Use `https://www.googleapis.com/auth/drive.file` for files the app creates or files the user explicitly selects for the app.
- Use an explicit template connection/import flow or Google Picker rather than broad Drive listing.
- Avoid broad Drive scopes unless the prototype cannot proceed without them.
- Avoid Gmail scopes by default.
- Add `https://www.googleapis.com/auth/gmail.send` only if direct send becomes a required feature.

## Lifecycle

Form phase is derived from the latest terminal governance event.


| Latest Terminal Event | Phase          |
| --------------------- | -------------- |
| None                  | `Drafting`     |
| `submit`              | `Under review` |
| `request_changes`     | `Revising`     |
| `approve`             | `Approved`     |


Non-terminal events must not affect phase.

Non-terminal examples:

- `form_created`
- `auth_sign_in`
- `connected_account_created`
- `connected_account_refreshed`
- `connected_account_revoked`
- `draft_sent`
- `draft_marked_sent`
- `draft_skipped`
- `action_failed`

## User Stories

1. As an admin, I want to connect my personal Google account, so the app can create and manage prototype Drive/Sheets files.
2. As an admin, I want to see which Google account is connected, so I understand who owns generated files.
3. As an admin, I want clear reconnect states when OAuth fails, so I can recover without corrupting form state.
4. As a participant, I want to sign in with a magic link, so I can access the tower without managing a password.
5. As a participant, I want unregistered emails rejected, so form data is limited to exercise participants.
6. As an admin, I want phase counts, so I can assess exercise progress at a glance.
7. As an admin, I want a table of forms with owner, reviewer, phase, latest version, last action, and next action, so I know where attention is needed.
8. As an admin, I want to create a form from a Google Sheets template, so setup does not require manual file copying and database changes.
9. As an admin, I want setup changes explained before execution, so I can approve file, sharing, database, and event changes with confidence.
10. As a PIC, I want a form page scoped to my assigned form, so I see only the work I am responsible for.
11. As a PIC, I want to compare my workspace sheet against the prior submitted version, so I can verify changes before submitting.
12. As a PIC, I want prior reviewer comments beside the change preview, so I can check whether my revision addressed feedback.
13. As a PIC, I want a generated change summary, so I can understand the submission without reading every changed cell.
14. As a PIC, I want submission allowed only in `Drafting` or `Revising`, so invalid lifecycle transitions are blocked.
15. As a reviewer, I want to review a versioned for-review copy, so I am not reviewing a moving workspace target.
16. As a reviewer, I want to compare the submitted version against the previous submitted version or template baseline, so I can focus on what changed.
17. As a reviewer, I want to request changes only while the form is `Under review`, so feedback is tied to an active submitted version.
18. As a reviewer, I want to enter one or more comments when requesting changes, so the PIC receives actionable feedback.
19. As a reviewer, I want approval allowed only while the form is `Under review`, so approvals are tied to submitted versions.
20. As an admin, I want every terminal governance action to capture a snapshot, so audit evidence exists for the file state at decision time.
21. As an admin, I want snapshot downloads to be admin-only and short-lived, so audit bytes are not publicly exposed.
22. As a participant, I want an activity log, so I can understand what happened and when.
23. As an admin, I want failed external side effects logged, so partial failures are visible and recoverable.
24. As a participant, I want generated notification drafts, so routine coordination is easier.
25. As a maintainer, I want Google Drive/Sheets operations behind an interface, so governance logic does not depend directly on one file provider.
26. As a maintainer, I want test doubles for file operations, so governance behavior can be tested without real Google APIs.

## Product Requirements

### Authentication

- The app supports registered participant sign-in.
- Magic-link tokens are random, hashed at rest, single-use, and expiring.
- Sign-in creates an HTTP-only session cookie.
- Successful sign-in records an `auth_sign_in` event.
- Local development may use `DEV_AUTH_BYPASS=true`.
- Production rejects dev-auth bypass configuration.
- Participant authentication is separate from the connected Google account OAuth flow.

### Connected Account Management

- Admins can connect, inspect, reconnect, and disconnect the Google account used for file operations.
- Production governance actions that require Google writes are blocked when no valid connected account exists.
- Google failures are categorized and logged with form ID, action type, failed step, known file IDs, and error metadata.
- Disconnecting a Google account does not delete form records, events, snapshots, or drafts.
- If the connected account changes, existing files remain owned by the prior account unless manually transferred outside the app.

### Authorization

- Participants are identified by normalized email.
- Participants have a primary role and optional additional roles.
- Admins can access overview, setup, connected account status, form detail, and snapshot downloads.
- PICs can access assigned forms.
- Reviewers can access forms assigned to them for review.
- Unauthorized users are redirected away from form pages they cannot access.
- Snapshot download endpoints require admin role.
- Google file permissions must never replace app-side role checks.

### Admin Overview

- The overview shows counts for `Drafting`, `Under review`, `Revising`, and `Approved`.
- Each form row shows form name, PIC, reviewer, phase, latest version, last terminal action, relative activity time, and next expected action.
- form rows link to form detail.
- Versioned forms expose a Google Sheets link for the latest for-review copy or workspace fallback.
- Empty state renders when no forms exist.
- Connected Google account health is visible when file operations are required.

### form Detail

- form detail renders a common form header, role-specific work surface, and activity log.
- PICs see the PIC work surface.
- Assigned reviewers see the reviewer work surface.
- Admins see an observer/admin surface.
- Google Sheet links open the relevant workspace or for-review copy.
- Preview loading failures do not crash the page.

### PIC Surface

- PIC surface loads a pre-submit preview while phase is `Drafting` or `Revising`.
- Preview includes deterministic cell diffs, before/after grids, prior reviewer comments, and AI-generated bullets.
- First submission compares against the form-created template baseline when available.
- Resubmission compares against the latest submitted for-review version.
- Submit CTA is disabled if preview is unavailable or phase is invalid.
- Submit determines the next version from prior submit events and form metadata.

### Reviewer Surface

- Reviewer surface loads a pre-decision preview when a submitted version exists.
- Preview compares the latest submitted version against the previous submitted version or baseline.
- Reviewer actions are disabled unless phase is `Under review`.
- Request changes requires at least one non-empty comment.
- Approval may include an optional note.

### form Setup

Admin form setup must:

- Verify actor is an admin.
- Verify a connected Google account exists and has required scopes.
- Normalize form name.
- Reject duplicate form names.
- Normalize PIC and reviewer emails.
- Reject a PIC already assigned to a different form.
- Copy the configured Google Sheets template into the workspace folder.
- Write form, PIC, and reviewer fields into configured cells or named ranges.
- Capture a baseline snapshot or baseline range state.
- Share the workspace sheet with the PIC as editor.
- Create or update participant records.
- Create the form record.
- Write a `form_created` event.
- Attempt to trash partially created files when setup fails after file creation and Drive permissions allow cleanup.

The setup assistant must require explicit admin approval before executing setup.

### Submit For Review

When a PIC submits:

- Verify actor is the assigned PIC.
- Verify phase is `Drafting` or `Revising`.
- Verify the connected Google account can access the workspace sheet.
- Determine the next version.
- Copy the workspace Google Sheet into the configured for-review folder.
- Share the for-review copy with the reviewer.
- Append a review-history row to the workspace sheet.
- Export the for-review copy as `.xlsx`.
- Hash and store snapshot bytes.
- Insert a snapshot row.
- Insert a `submit` event referencing the snapshot.
- Update form latest version and latest for-review file pointer.
- Create or promote a pending notification draft.
- On failure, write an `action_failed` event with the failed step and known Google file IDs.

### Request Changes

When a reviewer requests changes:

- Verify actor is the assigned reviewer.
- Verify phase is `Under review`.
- Validate at least one non-empty comment.
- Append each comment to the configured comments sheet or table in the for-review file.
- Append a review-history row to the workspace sheet.
- Compute a link to the reviewer-comments sheet or range when possible.
- Downgrade reviewer access on the for-review file to read-only when possible.
- Export, hash, and store a snapshot.
- Insert a `request_changes` event referencing the snapshot.
- Create or promote a pending notification draft.
- On failure, write an `action_failed` event.

### Approve

When a reviewer approves:

- Verify actor is the assigned reviewer.
- Verify phase is `Under review`.
- Append an approval row to the workspace review-history sheet or table.
- Protect the configured form sheet or range in the workspace Google Sheet.
- Export, hash, and store a snapshot of the for-review copy.
- Insert an `approve` event referencing the snapshot.
- Create or promote a pending notification draft.
- On failure, write an `action_failed` event.

### Snapshots

- Every terminal governance action captures exactly one snapshot.
- Snapshot bytes are exported as `.xlsx` from Google Sheets where possible.
- Snapshot hash uses SHA-256.
- Snapshot storage keys are unique and immutable.
- Snapshot records include form, version, action, storage key, hash, byte size, event ID, source file ID, and created timestamp.
- Admin download redirects to a short-lived signed URL.
- If snapshot export or storage fails, terminal event insertion does not happen.

### Diffs And Previews

- The system reads configured cell ranges from Google Sheets.
- The system computes deterministic raw cell diffs.
- The system can read values and formulas where configured.
- Diff summaries are cached by form, from version, to version, and input hash.
- Cached diffs are reused on matching input.
- AI summaries describe changes in 3-5 business-language bullets.
- Raw diffs and grids remain available for UI display even when the summary is concise.

### Notification Drafts

- Drafts include form, event ID when applicable, recipient, subject, body, status, input hash, created timestamp, and decided timestamp.
- Preview drafts may be created before a governance event.
- After successful governance, a matching preview draft may be promoted instead of regenerated.
- Draft statuses include `preview`, `pending`, `sent`, and `skipped`.
- The app logs `draft_sent`, `draft_marked_sent`, or `draft_skipped`.
- P0 supports draft-only behavior through copyable drafts or `mailto:` links.
- Direct Gmail sending is optional and requires explicit product approval, additional OAuth scope, and clear consent copy.

## Technical Requirements

- The application is a React web app hosted on Cloudflare.
- Client routing, data fetching, mutations, and forms use TanStack tools where appropriate.
- Supabase Postgres, accessed through Drizzle, is the runtime database.
- Supabase Storage stores private snapshot bytes.
- Cloudflare-hosted server endpoints own privileged mutations, session handling, Google API calls, token refresh, AI calls, and snapshot download redirects.
- `V3Store` is the persistence abstraction for participants, forms, events, snapshots, drafts, diffs, magic links, sessions, and connected accounts.
- `FileStore` is the substrate abstraction for spreadsheet operations.
- The first `FileStore` implementation targets Google Drive and native Google Sheets.
- Events are the source of truth for lifecycle phase.
- form records store operational pointers, not authoritative phase.
- External side effects happen before terminal event insertion.
- Terminal events mean the governance action completed.
- Failures are logged as non-terminal `action_failed` events.

## Data Model

Core entities:

- `participants`: registered users, roles, form assignment, display name.
- `connected_accounts`: provider, account email, encrypted refresh token, granted scopes, token expiry, status, last checked timestamp, and last error.
- `form_templates`: template file ID, configured ranges, comments sheet name, review-history sheet name, and baseline metadata.
- `forms`: form name, PIC, reviewer, workspace file ID, latest for-review file ID, latest version, and operational metadata.
- `file_refs`: provider-specific file IDs, MIME type, web URL, folder role, owner account email, and last known title.
- `events`: append-only audit trail.
- `snapshots`: immutable file captures tied to governance events.
- `drafts`: generated or finalized notification drafts.
- `diffs`: cached raw and summarized spreadsheet diffs.
- `magic_links`: hashed sign-in tokens.
- `sessions`: hashed session tokens and expiry metadata.

Important event types:

- `connected_account_created`
- `connected_account_refreshed`
- `connected_account_revoked`
- `form_created`
- `auth_sign_in`
- `submit`
- `request_changes`
- `approve`
- `draft_sent`
- `draft_marked_sent`
- `draft_skipped`
- `action_failed`

## Acceptance Criteria

- Admin can connect a personal Google account and see account health.
- Admin can create a form from a Google Sheets template through an approval-gated setup flow.
- Created workspace files are owned by the connected Google account.
- Workspace files are shared with assigned PICs.
- For-review copies are shared with assigned reviewers.
- A registered participant can sign in and land on the correct role-aware surface.
- An admin can see all configured forms and phase counts.
- A PIC can submit an initial form, producing a for-review copy, sharing change, snapshot, event, version update, and pending draft.
- A reviewer can request changes with comments, producing sheet comments/history, sharing downgrade when possible, snapshot, event, phase change, and pending draft.
- A PIC can resubmit after changes, producing version 2.
- A reviewer can approve, producing an approval event, snapshot, workspace protected range, and final `Approved` phase.
- Invalid phase transitions are blocked.
- Unauthorized actors are blocked from governance actions.
- Snapshot failure prevents terminal event insertion.
- Google API failure logs an `action_failed` event without changing lifecycle phase.
- Agent draft failure after successful governance logs an `action_failed` event without changing lifecycle derivation.
- Matching preview drafts are promoted after submit rather than regenerated.
- Tests can exercise governance flows without real Google Drive, Google Sheets, or object storage.

## Testing Requirements

Priority tests:

- Connected account status and reconnect behavior.
- Google `FileStore` behavior through test doubles.
- form setup with template copy, field writes, sharing, and event insertion.
- Governance actions.
- Phase derivation.
- Snapshot/event consistency.
- Unauthorized actions.
- Invalid phase transitions.
- Request-changes comment validation.
- Revision and approval cycles.
- Protected range application on approval.
- Preview draft promotion.
- AI draft and summary failure handling.
- Notification renderer output.
- Preview/reconciliation behavior.

Later tests:

- Snapshot download endpoint authorization.
- Magic-link expiry and reuse.
- Admin setup assistant approval and denial UI.
- PIC and reviewer UI integration flows.
- Snapshot signed URL failure behavior.
- OAuth token revocation recovery.
- Drive permission failure recovery.

## Risks And Open Questions

- Personal-account OAuth means file operations depend on one connected account.
- If the connected account is revoked, deleted, or loses access, governance actions that require file writes will stop.
- Files created by a personal account are not administratively recoverable like Workspace-owned files.
- Narrow `drive.file` scope requires an explicit template/folder connection flow.
- Broad Drive scopes may increase consent and verification burden.
- Participant emails must map to Google accounts if sharing uses specific email addresses.
- If participants cannot access shared files, the product needs link-sharing or an in-app-only review fallback.
- Protected ranges reduce casual edits but do not replace immutable snapshots.
- Google Sheets `.xlsx` export may not preserve every native Sheets feature exactly.
- External side effects can partially complete before an action failure is logged.
- Operational recovery needs a runbook for partial file/sharing failures.
- Preview generation depends on Google API availability and AI configuration.

## Success Metrics

- One connected personal Google account can run the prototype without a Google Workspace business account.
- Seeded forms can complete submit-review-approve.
- At least one form can complete request-changes and resubmission.
- Every terminal governance event has exactly one snapshot.
- Approved forms have protected workspace form sheets or ranges.
- Admin can explain current state from the overview without opening Google Sheets.
- PICs and reviewers use preview diffs before actions.
- Notification drafts are useful enough to send or lightly edit.
- No form phase requires manual correction.

## Future Opportunities

- Add per-user Google OAuth for stronger permission mirroring.
- Add direct Gmail sending after explicit scope and consent review.
- Add active drift detection by comparing current exported bytes against the latest approved snapshot.
- Add audit-pack export with snapshots, event CSV, hashes, and summaries.
- Add richer reviewer assignment and routing.
- Add structured BSC validation rules alongside agent summaries.
- Add a coordinator assistant that answers status questions from the event log.
- Add notification queues and reminders for overdue forms.
- Add additional file substrates once the Google path is proven.

