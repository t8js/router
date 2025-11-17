import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { LocationPattern } from "../types/LocationPattern.ts";
import type { URLSchema } from "../types/URLSchema.ts";

export type MatchState<P extends LocationPattern> = {
  ok: boolean;
  href: string;
  params: P extends { _schema: URLSchema }
    ? StandardSchemaV1.InferOutput<P["_schema"]> extends {
        params?: Record<string, unknown>;
      }
      ? StandardSchemaV1.InferOutput<P["_schema"]>["params"]
      : Record<string, never>
    : Record<string, string | undefined>;
  query: P extends { _schema: URLSchema }
    ? StandardSchemaV1.InferOutput<P["_schema"]> extends {
        query?: Record<string, unknown>;
      }
      ? StandardSchemaV1.InferOutput<P["_schema"]>["query"]
      : Record<string, never>
    : Record<string, string | undefined>;
};
