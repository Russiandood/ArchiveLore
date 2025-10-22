import BuilderRegistry from './BuilderRegistry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BuildingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <BuilderRegistry />  {/* ensures custom components are registered on the client */}
      {children}
    </div>
  );
}
