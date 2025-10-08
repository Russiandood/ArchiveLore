import Providers from "./providers";

export const metadata = {
  title: "On-Stream Game",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <Providers>{children}</Providers>
    </body></html>
  );
}
