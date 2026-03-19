import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Airport Security Wait Advisor",
    short_name: "Airport Advisor",
    description: "Real-time security wait estimates for BOS & DUB airports",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1419",
    theme_color: "#e8750a",
    orientation: "any",
    categories: ["travel", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
