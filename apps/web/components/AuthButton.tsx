"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <button disabled>Loading…</button>;
  if (!session)
    return <button onClick={() => signIn("twitch")} className="border px-3 py-2 rounded">Sign in with Twitch</button>;

  const img = session.user?.image as string | undefined;
  const name = session.user?.name ?? "Twitch User";

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {img ? <img src={img} width={28} height={28} style={{ borderRadius: 999 }} /> : null}
      <span>Hi, {name}</span>
      <button onClick={() => signOut()} className="border px-3 py-2 rounded">Sign out</button>
    </div>
  );
}
