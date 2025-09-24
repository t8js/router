import type { UnpackedURLSchema, URLSchema } from "unpack-schema";
import type { LocationShape } from "./LocationShape";
import type { LocationValue } from "./LocationValue";

export type URLData<T extends LocationValue = LocationValue> = T extends {
  _schema: URLSchema;
}
  ? UnpackedURLSchema<T["_schema"]>
  : LocationShape;
