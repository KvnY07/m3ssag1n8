import type { JSONSchema } from "json-schema-to-ts";
import { FromSchema } from "json-schema-to-ts";

export const WorkspacesSchema = {
  $id: "workspaces.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "workspaces",
  type: "array",
  items: {
    type: "object",
    $ref: "#/definitions/workspace",
  },
  definitions: {
    workspace: {
      type: "object",
      required: ["doc", "meta", "path"],
      additionalProperties: false,
      properties: {
        doc: { type: "object" },
        meta: {
          type: "object",
          $ref: "#/definitions/metadata",
        },
        path: { type: "string" },
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
        createdAt: { type: "integer", minimum: 0 },
        createdBy: { type: "string" },
        lastModifiedAt: { type: "integer", minimum: 0 },
        lastModifiedBy: { type: "string" },
      },
    },
  },
} as const satisfies JSONSchema;

export type Workspaces = FromSchema<typeof WorkspacesSchema>;
