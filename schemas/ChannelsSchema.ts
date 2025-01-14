import type { JSONSchema } from "json-schema-to-ts";
import { FromSchema } from "json-schema-to-ts";

// Define the schema
export const ChannelsSchema = {
  $id: "channels.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "channels",
  type: "array",
  items: {
    type: "object",
    $ref: "#/definitions/channel",
  },
  definitions: {
    channel: {
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

// Generate the TypeScript type from the schema
export type Channels = FromSchema<typeof ChannelsSchema>;
