import test from "node:test";
import assert from "node:assert/strict";
import { feature } from "../features/empty-state.ts";

test("empty-state contribution only changes rendering", () =>
  assert.equal(feature.filterPosts, undefined));
