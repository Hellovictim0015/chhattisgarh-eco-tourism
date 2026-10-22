import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the project root; a stray C:\Users\chand\package-lock.json otherwise makes
  // Turbopack treat the whole home folder as the workspace.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  // The site moved from property listings to hotel booking; send old links to the new pages.
  async redirects() {
    return [
      { source: "/allproject", destination: "/hotels", permanent: false },
      { source: "/property/:id", destination: "/hotels", permanent: false },
      { source: "/myProperty", destination: "/my-hotels", permanent: false },
    ];
  },
};

export default nextConfig;
