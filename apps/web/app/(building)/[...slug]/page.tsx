import { builder } from '@/lib/builder';
import { BuilderComponent } from '@builder.io/react';

export const dynamic = 'force-dynamic'; // never pre-render at build
export const revalidate = 0;

type Props = {
  params: { slug?: string[] };
  searchParams: Record<string, string>;
};

export default async function Page({ params, searchParams }: Props) {
  const urlPath = '/' + (params.slug?.join('/') ?? '');
  const isPreview = Object.prototype.hasOwnProperty.call(searchParams, 'builder.preview');

  // If the key isn't available at build for any reason, fail soft.
  if (!process.env.NEXT_PUBLIC_BUILDER_API_KEY) {
    return null;
  }

  const content = await builder
    .get('builder-page', { url: urlPath, cachebust: isPreview })
    .toPromise()
    .catch(() => null);

  // Don’t throw notFound() at build time; fail soft so build can finish.
  if (!content) return null;

  return <BuilderComponent model="builder-page" content={content} />;
}
