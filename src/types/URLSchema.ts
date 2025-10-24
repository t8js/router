import type { StandardSchemaV1 } from "@standard-schema/spec";

export type URLSchema = StandardSchemaV1<{
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
}>;
