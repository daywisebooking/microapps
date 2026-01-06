// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  // We inferred 44 attributes!
  // Take a look at this schema, and if everything looks good,
  // run `push schema` again to enforce the types.
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
      username: i.string().optional(),
    }),
    apps: i.entity({
      createdAt: i.number().optional(),
      description: i.string().optional(),
      favoriteCount: i.number().optional(),
      logoUrl: i.string().optional(),
      name: i.string().optional(),
      slug: i.string().optional(),
      tagline: i.string().optional(),
      tags: i.json().optional(),
      voteCount: i.number().optional(),
      websiteUrl: i.string().optional(),
    }),
    comments: i.entity({
      appId: i.string().optional(),
      content: i.string().optional(),
      createdAt: i.number().optional(),
      parentId: i.string().optional(),
      status: i.string().optional(),
      type: i.string().optional(),
      userId: i.string().optional(),
      voteCount: i.number().optional(),
    }),
    commentVotes: i.entity({
      commentId: i.string().optional(),
      createdAt: i.number().optional(),
      direction: i.string().optional(),
      userId: i.string().optional(),
    }),
    events: i.entity({
      appId: i.string().optional(),
      createdAt: i.number().optional(),
      eventType: i.string().optional(),
      metadata: i.json().optional(),
      userId: i.string().optional(),
    }),
    favorites: i.entity({
      appId: i.string().optional(),
      createdAt: i.number().optional(),
      userId: i.string().optional(),
    }),
    featured: i.entity({
      appId: i.string().optional(),
      badges: i.json().optional(),
      createdAt: i.number().optional(),
    }),
    reports: i.entity({
      commentId: i.string().optional(),
      createdAt: i.number().optional(),
      reason: i.string().optional(),
      status: i.string().optional(),
      type: i.string().optional(),
      userId: i.string().optional(),
      violations: i.json().optional(),
    }),
    votes: i.entity({
      appId: i.string().optional(),
      createdAt: i.number().optional(),
      direction: i.string().optional(),
      userId: i.string().optional(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
