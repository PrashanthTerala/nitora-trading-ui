import { Link } from 'react-router-dom';
import { usePageMeta } from '@/lib/pageMeta';
import { t } from '@/i18n';

export function NotFoundPage() {
  usePageMeta({ title: t('meta.notFound'), noindex: true });
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className="text-6xl">🕯️</div>
      <h1 className="mt-4 text-2xl font-bold">That page gapped down and never filled.</h1>
      <p className="mt-2 text-ink-soft">The address does not exist. Head back to the curriculum.</p>
      <Link to="/learn" className="btn-primary mt-6">
        Go to lessons
      </Link>
    </div>
  );
}
