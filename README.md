# Forum Inbox

A standalone, milestone-only PR Flood scenario built on the Forum application baseline. Players plan their own issues, run Louibot locally, review its draft pull requests, and merge changes that pass the protected behavioral check.

The milestone is a private activity inbox for replies and votes on a member's own threads. It spans the activity query, per-member read state, and the interface and navigation, so a single broad issue can reach the milestone but earns weak issue-breakdown credit.

The protected check is Forum Inbox E2E / behavior. It starts the real Forum server and exercises its public HTTP API with separate demo identities. The suite is deliberately separate from the ordinary application tests so the starting baseline can keep passing its own CI while the milestone is incomplete.

This checkout is prepared locally. Before publishing it as a catalog scenario, create a dedicated GitHub repository, add it to PR Flood's scenario repository allowlist, and pin the scenario release workflow to an engine commit that includes milestone-mode support.
