import type { MetadataRoute } from "next";

// Native App Router manifest route (see node_modules/next/dist/docs's
// file-conventions/metadata/manifest.md for this Next version) -- Next
// serves this at /manifest.webmanifest and injects the <link rel="manifest">
// tag into <head> itself, so nothing needs to be added to layout.tsx for
// that. theme_color/background_color match the existing viewport.themeColor
// in layout.tsx (#0b0f14), confirmed still current there.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HeavyHaul Escort Loads",
    short_name: "HeavyHaul",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
