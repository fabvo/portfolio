import type { NextConfig } from "next";

/**
 * Für GitHub Pages erzeugen wir einen statischen Export.
 *
 * Lokal (`npm run dev`) bleibt NEXT_PUBLIC_BASE_PATH leer, damit das
 * Projekt unter http://localhost:3000/ läuft.
 *
 * Im CI (siehe .github/workflows/deploy.yml) wird NEXT_PUBLIC_BASE_PATH
 * auf "/<repo-name>" gesetzt, damit Assets unter
 * https://<user>.github.io/<repo-name>/ korrekt geladen werden.
 *
 * Falls dein Repo NICHT "portfolio" heißt, ändere im Workflow nur den
 * Wert von NEXT_PUBLIC_BASE_PATH — diese Datei muss nicht angefasst werden.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    // GitHub Pages hat keinen Image-Optimizer
    unoptimized: true,
  },
  // /me → /me/index.html (statt /me.html); GitHub Pages mag das lieber.
  trailingSlash: true,
};

export default nextConfig;
