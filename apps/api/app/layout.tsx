import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OSG API Host",
  description: "Health check and API host for On-Stream Game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
