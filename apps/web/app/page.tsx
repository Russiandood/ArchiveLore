import AuthButton from "../components/AuthButton";

export default function Page() {
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h1>On-Stream Game</h1>
      <p>Web app is alive. Sign in to start testing.</p>
      <AuthButton />
    </main>
  );
}
