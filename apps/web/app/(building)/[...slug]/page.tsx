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

  const hasKey = Boolean(process.env.NEXT_PUBLIC_BUILDER_API_KEY);

  let content: any = null;
  let error: any = null;

  try {
    content = await builder
      .get('builder-page', { url: urlPath, cachebust: isPreview })
      .toPromise();
  } catch (e) {
    error = String(e);
  }

  // TEMP: if nothing comes back, show a diagnostic instead of 404/null
  if (!content) {
    return (
      <pre style={{ padding: 16, background: '#111', color: '#eee', whiteSpace: 'pre-wrap' }}>
        {[
          'Builder debug',
          `urlPath: ${urlPath}`,
          `has NEXT_PUBLIC_BUILDER_API_KEY: ${hasKey}`,
          `isPreview: ${isPreview}`,
          `model: builder-page`,
          `content: ${content === null ? 'null' : typeof content}`,
          error ? `error: ${error}` : '',
        ].filter(Boolean).join('\n')}
      </pre>
    );
  }

  return <BuilderContentClient model="builder-page" content={content} />;
}
