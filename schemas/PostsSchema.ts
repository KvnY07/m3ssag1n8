import type { JSONSchema } from "json-schema-to-ts";
import { FromSchema } from "json-schema-to-ts";

export const PostSchema = {
  $id: "post.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "post",
  type: "object",
  required: ["doc", "meta", "path"],
  additionalProperties: false,
  properties: {
    doc: {
      type: "object",
      $ref: "#/definitions/postContents",
    },
    meta: {
      type: "object",
      $ref: "#/definitions/metadata",
    },
    path: {
      type: "string",
    },
  },
  definitions: {
    postContents: {
      type: "object",
      required: ["msg"],
      additionalProperties: false,
      properties: {
        msg: {
          type: "string",
        },
        parent: {
          type: "string",
        },
        reactions: {
          type: "object",
          $ref: "#/definitions/reactions",
        },
        extensions: {
          type: "object",
        },
      },
    },
    metadata: {
      type: "object",
      required: [
        "createdAt",
        "createdBy",
        "lastModifiedAt",
        "lastModifiedBy",
      ],
      additionalProperties: false,
      properties: {
        createdAt: {
          type: "integer",
          minimum: 0,
        },
        createdBy: {
          type: "string",
        },
        lastModifiedAt: {
          type: "integer",
          minimum: 0,
        },
        lastModifiedBy: {
          type: "string",
        },
      },
    },
    reactions: {
      type: "object",
      properties: {
        ":celebrate:": {
          type: "array",
          items: { type: "string" },
        },
        ":frown:": {
          type: "array",
          items: { type: "string" },
        },
        ":like:": {
          type: "array",
          items: { type: "string" },
        },
        ":smile:": {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const satisfies JSONSchema;

export type Post = FromSchema<typeof PostSchema>;
