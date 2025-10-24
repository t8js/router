import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { LocationPattern } from "./LocationPattern";
import type { LocationShape } from "./LocationShape";
import type { URLSchema } from "./URLSchema";

export type MatchParams<P extends LocationPattern> = P extends {
  _schema: URLSchema;
}
  ? StandardSchemaV1.InferOutput<P["_schema"]>
  : LocationShape<string | undefined>;
