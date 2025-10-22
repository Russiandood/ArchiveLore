import { builder } from '@/lib/builder';
import { BuilderComponent } from '@builder.io/react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // don't pre-render at build
export const revalidate = 0;            // no ISR while we integrate

type Props = {
  params: { slug?: string[] };
  searchParams: Record<string, string>;
};

export default async function Page({ params, searchParams }: Props) {
  const urlPath = '/' + (params.slug?.join('/') ?? '');
  const isPreview = Object.prototype.hasOwnProperty.call(searchParams, 'builder.preview');

  try {
    // IMPORTANT: model name must match your Builder model
    const content = await builder
      .get('builder-page', { url: urlPath, cachebust: isPreview })
      .toPromise();

    if (!content) {
      notFound();
    }

    return <BuilderComponent model="builder-page" content={content} />;
  } catch {
    notFound();
  }
}
