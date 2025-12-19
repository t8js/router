export type NavigationOptions = {
  target?: string;
  href?: string;
  referrer?: string;
  spa?: "auto" | "off" | undefined;
  history?: "push" | "replace" | undefined;
  scroll?: "auto" | "off" | undefined;
  id?: string;
};
