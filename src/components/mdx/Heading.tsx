import type { ComponentPropsWithoutRef } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { slugify, textOf } from '@/lib/slug';
import { t } from '@/i18n';

/**
 * `##` and `###` in a lesson, marked for the on-this-page list, with a link mark that appears
 * on hover and focus. The id comes from the build (rehypeHeadingIds, unique within the lesson);
 * a heading rendered some other way falls back to a slug of its text.
 */
function heading(level: 2 | 3) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return function Heading({ children, id: given, ...rest }: ComponentPropsWithoutRef<'h2'>) {
    const id = given ?? slugify(textOf(children));
    return (
      <Tag id={id} data-toc={level} className="group/heading" {...rest}>
        {children}
        <a href={`#${id}`} aria-label={t('lesson.linkToSection')} className="heading-anchor ml-2 inline-flex translate-y-[-0.1em] align-middle text-ink-muted opacity-0 transition-opacity duration-(--duration-fast) hover:text-accent focus-visible:opacity-100 group-hover/heading:opacity-100">
          <LinkIcon size={level === 2 ? 18 : 15} strokeWidth={1.75} aria-hidden />
        </a>
      </Tag>
    );
  };
}

export const H2 = heading(2);
export const H3 = heading(3);
