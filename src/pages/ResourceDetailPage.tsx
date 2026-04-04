import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Heart,
  Phone,
  Scale,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  EXTERNAL_RESOURCE_LINKS,
  HELPLINES,
  getDownloadGuideBySlug,
  getResourceBySlug,
  type ResourceIconKey,
} from '../data/resources';

const RESOURCE_ICONS: Record<ResourceIconKey, LucideIcon> = {
  legal: Scale,
  safety: Shield,
  'mental-health': Heart,
  'self-defense': Shield,
};

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const resource = slug ? getResourceBySlug(slug) : undefined;

  if (!resource) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-500">Resource Not Found</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">This resource page does not exist.</h1>
          <p className="mt-4 text-slate-500">
            The link may be outdated, but the main resources hub is still available and fully connected.
          </p>
          <Link
            to="/resources"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3 font-bold text-white transition-colors hover:bg-rose-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const Icon = RESOURCE_ICONS[resource.iconKey];
  const downloadGuide = resource.downloadSlug ? getDownloadGuideBySlug(resource.downloadSlug) : undefined;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <Link to="/resources" className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" />
            Back to all resources
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),360px]">
          <article className="rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm md:p-14">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl', resource.colorClass)}>
                <Icon className="h-8 w-8" />
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {resource.readTime}
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-900 md:text-5xl">{resource.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">{resource.intro}</p>

            <div className="mt-12 space-y-10">
              {resource.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-black text-slate-900">{section.title}</h2>
                  <div className="mt-5 space-y-4">
                    {section.items.map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-8">
            <section className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-200">
              <h2 className="text-xl font-black">Keep this guide offline</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Download a printable version so the steps are available even if you lose signal or need to leave quickly.
              </p>
              {downloadGuide ? (
                <a
                  href={downloadGuide.href}
                  download={downloadGuide.fileName}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-rose-700"
                >
                  <Download className="h-4 w-4" />
                  Download {downloadGuide.name}
                </a>
              ) : null}
            </section>

            <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="flex items-center gap-3 text-xl font-black text-slate-900">
                <Phone className="h-5 w-5 text-rose-600" />
                Emergency contacts
              </h2>
              <div className="mt-6 space-y-5">
                {HELPLINES.map((helpline) => (
                  <a
                    key={helpline.number}
                    href={`tel:${helpline.number}`}
                    className="block rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-rose-50"
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{helpline.name}</div>
                    <div className="mt-2 text-2xl font-black text-slate-900">{helpline.number}</div>
                    <div className="mt-1 text-sm text-slate-500">{helpline.desc}</div>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Official support links</h2>
              <div className="mt-6 space-y-4">
                {EXTERNAL_RESOURCE_LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-rose-50"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-700 transition-colors group-hover:text-rose-600">
                        {link.name}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{link.description}</p>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-rose-600" />
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
