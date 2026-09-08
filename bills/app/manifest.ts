import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diary",
    short_name: "Diary",
    description: "A simple digital business diary for local businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#020617",
    icons: [{ src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" }],
  };
}
