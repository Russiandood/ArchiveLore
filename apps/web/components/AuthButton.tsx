"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button className="border px-3 py-2 rounded opacity-60" disabled>
        Checking session…
      </button>
    );
  }

  if (!session) {
    return (
      <button
        className="border px-3 py-2 rounded"
        onClick={() => signIn("twitch")}
      >
        Sign in with Twitch
      </button>
    );
  }

  const name = session.user?.name ?? "Twitch User";
  const image =
    // primary: what we set in session callback
    session.user?.image ??
    // back-compat if any old code still sets it
    (session.user as any)?.profileImageUrl ??
    null;

  return (
    <div className="flex items-center gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          width={28}
          height={28}
          alt="avatar"
          style={{ borderRadius: 999 }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "#444",
          }}
        />
      )}
      <span>Hi, {name}</span>
      <button className="border px-3 py-2 rounded" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}
