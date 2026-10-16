---
title: Stage 1 — A private activity inbox
mode: milestone
requiredCheck: Forum Inbox E2E / behavior
workflowPath: .github/workflows/inbox-e2e.yml
protectedFiles:
  - .github/workflows/inbox-e2e.yml
  - playwright.config.ts
  - test/e2e/inbox.spec.ts
  - package.json
  - package-lock.json
evaluation:
  issueBreakdown: "Reward independently reviewable issues that divide the feed query, private read state, and interface/navigation into coherent slices. One broad issue covering all three areas is weak decomposition; issue count itself is not a gate."
  issueClarity: "Reward focused scope and testable acceptance criteria that let Louibot implement without repeated clarification. If Louibot needs repeated clarification and no linked PR is merged, lower this score."
  pullRequestQuality: "Judge correctness, privacy, data handling, UI behavior, accessibility, and maintainability against the objective. A passing E2E suite establishes milestone behavior, not excellent code quality."
  reviewQuality: "Reward review comments that identify consequential privacy, ordering, read-state, or regression risks and give actionable feedback. Give little credit for cosmetic-only nitpicks or generic praise."
endings:
  success: Members can catch up on their own conversations.
  incomplete: The private inbox still needs work.
  partial: The milestone could not be fully assessed.
---

Members need a reliable way to catch up on activity in their own discussions. Build an activity inbox for replies and votes on threads created by the signed-in member.

Expose GET /api/inbox as an object containing an items array. Each item needs an opaque id, type (reply or vote), postId, thread title, actor display name, and read state. Include events on the current member's own threads only, exclude events authored by that member, order newest first, and return at most 20 items. Opening an event navigates to its original thread using the #post-<id> anchor. Unread items must be distinguishable, and opening one marks it read. Read state is private to the current member.

Add an accessible button named Activity inbox, a useful empty state, and a way back to the thread feed. Render inbox events as links whose names include the actor and thread title; reply links also show the reply text, vote links say who voted, and unread links show Unread. Keep the protected browser E2E suite passing for replies, votes, privacy boundaries, newest-20 ordering, navigation, and private read state.
