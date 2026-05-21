/** Embed iframe: always dynamic; avoid static path / vendor-chunk generation for DB-backed pages. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
