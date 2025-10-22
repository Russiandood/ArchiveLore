'use client';

console.log('Builder: custom components registered');

import { Builder } from '@builder.io/react';

function Hero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="container mx-auto px-6 py-20">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-4 text-lg opacity-80">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

Builder.registerComponent(Hero, {
  name: 'Hero',
  inputs: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'longText' },
  ],
  canHaveChildren: true, // lets editors drop buttons, images, etc. inside
});

function FeatureGrid({ items = [] as { title: string; body?: string }[] }) {
  return (
    <section className="container mx-auto px-6 py-12 grid gap-6 md:grid-cols-3">
      {items.map((it, i) => (
        <div key={i} className="p-6 rounded-2xl border">
          <h3 className="font-semibold text-xl">{it.title}</h3>
          {it.body ? <p className="mt-2 opacity-80">{it.body}</p> : null}
        </div>
      ))}
    </section>
  );
}

Builder.registerComponent(FeatureGrid, {
  name: 'FeatureGrid',
  inputs: [
    {
      name: 'items',
      type: 'list',
      subFields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'longText' },
      ],
    },
  ],
});
