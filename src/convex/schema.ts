import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  projects: defineTable({
    ownerId: v.string(),
    name: v.string(),
    description: v.string(),
    prompt: v.string(),
    status: v.string(),
    intent: v.any(),
    files: v.any(),
    assets: v.any(),
    readiness: v.any(),
    brain: v.any(),
    activeJobId: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  jobs: defineTable({
    projectId: v.string(),
    prompt: v.string(),
    status: v.string(),
    currentStep: v.string(),
    progress: v.number(),
    logs: v.any(),
    qaReport: v.any(),
    readiness: v.any(),
    error: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  credits: defineTable({
    accountId: v.string(),
    date: v.string(),
    used: v.number(),
  }).index('by_account', ['accountId']),

  intakeSessions: defineTable({
    sessionId: v.string(),
    answers: v.array(v.string()),
  }).index('by_session', ['sessionId']),

  visualDocuments: defineTable({
    docId: v.string(),
    name: v.string(),
    route: v.string(),
    version: v.number(),
    root: v.any(),
    updatedAt: v.string(),
    publishedAt: v.optional(v.string()),
  }).index('by_doc', ['docId']),
});
