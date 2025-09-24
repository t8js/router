import type { URLSchema } from "unpack-schema";
import type { LocationShape } from "./LocationShape";

// URL builder output
export type LocationObject = {
  _schema: URLSchema;
  exec: (x: string) => LocationShape | null;
  // biome-ignore lint/suspicious/noExplicitAny: third-party
  compile: (x: any) => string;
  toString: () => string;
};
