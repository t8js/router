import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { LocationValue } from "./LocationValue";
import type { URLComponents } from "./URLComponents";
import type { URLSchema } from "./URLSchema";

export type URLData<T extends LocationValue = LocationValue> = T extends {
  _schema: URLSchema;
}
  ? StandardSchemaV1.InferOutput<T["_schema"]>
  : URLComponents;
