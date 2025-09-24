import type { UnpackedURLSchema, URLSchema } from "unpack-schema";
import type { LocationPattern } from "./LocationPattern";
import type { LocationShape } from "./LocationShape";

type WithFallback<T, Fallback> = T extends undefined
  ? Fallback
  : T extends null
    ? Fallback
    : T;

type EmptyRecord<T> = T extends undefined
  ? Record<string, never>
  : T extends Record<string, unknown> | undefined
    ? Record<string, never> | { [K in keyof NonNullable<T>]: undefined }
    : Record<string, never>;

type NormalizedParams<T extends LocationShape | undefined> = WithFallback<
  {
    params: WithFallback<
      NonNullable<T>["params"],
      EmptyRecord<NonNullable<T>["params"]>
    >;
    query: WithFallback<
      NonNullable<T>["query"],
      EmptyRecord<NonNullable<T>["query"]>
    >;
  },
  {
    params: Record<string, never>;
    query: Record<string, never>;
  }
>;

type BaseMatchState = {
  ok: boolean;
  href: string;
};

export type MatchState<P extends LocationPattern> = P extends {
  _schema: URLSchema;
}
  ? BaseMatchState & NormalizedParams<UnpackedURLSchema<P["_schema"]>>
  : BaseMatchState & {
      params: Record<string, string | undefined>;
      query: Record<string, string | undefined>;
    };
