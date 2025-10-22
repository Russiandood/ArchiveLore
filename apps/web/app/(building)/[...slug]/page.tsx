import { builder } from '@/lib/builder';
import { BuilderComponent } from '@builder.io/react';

export const revalidate = 60;

type Props = {
  params: { slug?: string[] };
  searchParams: Record<string, string>;
};

export default async function Page({ params, searchParams }: Props) {
  const urlPath = '/' + (params.slug?.join('/') ?? '');
  const isPreview = Object.prototype.hasOwnProperty.call(searchParams, 'builder.preview');

  const content = await builder
    .get('page', { url: urlPath, cachebust: isPreview })
    .toPromise();

  if (!content) return null;

  return <BuilderComponent model="page" content={content} />;
}
