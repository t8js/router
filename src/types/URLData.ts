import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { LocationValue } from "./LocationValue.ts";
import type { URLComponents } from "./URLComponents.ts";
import type { URLSchema } from "./URLSchema.ts";

export type URLData<T extends LocationValue = LocationValue> = T extends {
  _schema: URLSchema;
}
  ? StandardSchemaV1.InferOutput<T["_schema"]>
  : URLComponents;
