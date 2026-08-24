import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project BILLS",
    short_name: "BILLS",
    description: "Simple invoices for local businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#020617",
    icons: [{ src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" }],
  };
}
