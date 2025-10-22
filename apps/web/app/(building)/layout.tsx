import BuilderRegistry from './BuilderRegistry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BuildingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* TEMP DEBUG: remove after we verify */}
      <div style={{position:'fixed', top:0, right:0, background:'#111', color:'#0f0', padding:'4px 8px', zIndex:99999}}>
        (building) layout active
      </div>

      <BuilderRegistry />
      {children}
    </div>
  );
}
