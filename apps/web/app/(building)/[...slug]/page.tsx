import { builder } from '@/lib/builder';
import BuilderContentClient from '@/components/BuilderContentClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: { slug?: string[] };
  searchParams: Record<string, string>;
};

export default async function Page({ params, searchParams }: Props) {
  const urlPath = '/' + (params.slug?.join('/') ?? '');
  const isPreview = Object.prototype.hasOwnProperty.call(searchParams, 'builder.preview');

  // Soft-guard if key isn’t injected during build-time analysis
  if (!process.env.NEXT_PUBLIC_BUILDER_API_KEY) {
    return null;
  }

  const content = await builder
    .get('builder-page', { url: urlPath, cachebust: isPreview })
    .toPromise()
    .catch(() => null);

  if (!content) return null;

  return <BuilderContentClient model="builder-page" content={content} />;
}
