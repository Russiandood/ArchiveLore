import AuthButton from '@/components/AuthButton';

export default function AppHome() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">On-Stream Game</h1>
      <p>Web app is alive. Sign in to start testing.</p>
      <AuthButton />
    </main>
  );
}
