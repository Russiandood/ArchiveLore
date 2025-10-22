'use client';

import { BuilderComponent } from '@builder.io/react';

export default function BuilderContentClient({
  content,
  model,
}: {
  content: any;
  model: string;
}) {
  return <BuilderComponent model={model} content={content} />;
}
