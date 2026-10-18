# Forum Inbox

A standalone, milestone-only PR Flood scenario built on the Forum application baseline. Players plan their own issues, run Louibot locally, review its draft pull requests, and merge changes that pass the protected behavioral check.

The milestone is a private activity inbox for replies and votes on a member's own threads. It spans the activity query, per-member read state, and the interface and navigation, so a single broad issue can reach the milestone but earns weak issue-breakdown credit.

The protected check is Forum Inbox E2E / behavior. It builds the real Forum app, opens it in Chromium, and exercises the public UI and HTTP API with separate demo identities. The suite is deliberately separate from the ordinary application tests so the starting baseline can keep passing its own CI while the milestone is incomplete.

The full milestone E2E check runs on the default branch after changes are merged. It does not run on intermediate pull requests; the ordinary Forum checks still run on each pull request.

This repository publishes immutable catalog packages from matching `vMAJOR.MINOR.PATCH` tags. Existing playthroughs stay pinned to their package version; new launches use the latest stable release.
