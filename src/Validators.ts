import { WorkspacesSchema } from "../schemas/WorkspacesSchema";
import { ChannelsSchema } from "../schemas/ChannelsSchema";
import { PostSchema } from "../schemas/PostsSchema";
import { $Compiler, wrapCompilerAsTypeGuard } from "json-schema-to-ts";
import Ajv from "ajv";

// Initialize AJV (Another JSON Validator), a JSON schema validator library
const ajv = new Ajv();

// Create a compiler function using AJV
// The compiler takes a JSON schema and returns a validation function
const $compile: $Compiler = (schema) => ajv.compile(schema);

// Wrap the compiler as a type guard
// This ensures type safety when using the compiled schema in TypeScript
const compile = wrapCompilerAsTypeGuard($compile);

// `isWorkspaces` is a type guard to validate data against WorkspacesSchema
export const isWorkspaces = compile(WorkspacesSchema);

// `isChannels` is a type guard to validate data against ChannelsSchema
export const isChannels = compile(ChannelsSchema);

// `isPost` is a type guard to validate data against PostSchema
export const isPost = compile(PostSchema);
