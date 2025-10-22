import BuilderRegistry from './BuilderRegistry';

export const revalidate = 0; // layout itself doesn't cache anything

export default function BuildingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <BuilderRegistry />
      {children}
    </div>
  );
}
