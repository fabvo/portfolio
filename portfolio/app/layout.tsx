import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fabio Voelkner — Portfolio",
  description:
    "Fabio Voelkner – Fachinformatiker, B.A. Medienproduktion, Game Designer in spe. Karten-basiertes Portfolio mit Drag & Drop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <div className="brand">Fabio Voelkner</div>
          <nav className="nav" aria-label="Sektionen">
            <span>Über</span>
            <span>Projekte</span>
            <span>Kontakt</span>
            <span>Playground</span>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
