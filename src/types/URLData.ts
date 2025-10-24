import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { LocationValue } from "./LocationValue";
import type { URLSchema } from "./URLSchema";
import { URLComponents } from "./URLComponents";

export type URLData<T extends LocationValue = LocationValue> = T extends {
  _schema: URLSchema;
}
  ? StandardSchemaV1.InferOutput<T["_schema"]>
  : URLComponents;
