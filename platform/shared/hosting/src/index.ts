export interface PlasmicHostingSettings {
  textFiles?: Record<string, string>;
  favicon?: { url: string };
  [key: string]: unknown;
}
