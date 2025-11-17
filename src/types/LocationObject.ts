import type { URLComponents } from "./URLComponents.ts";
import type { URLSchema } from "./URLSchema.ts";

// URL builder output
export type LocationObject = {
  _schema: URLSchema | undefined;
  exec: (x: string) => URLComponents | null;
  // biome-ignore lint/suspicious/noExplicitAny: third-party
  compile: (x: any) => string;
  toString: () => string;
};
