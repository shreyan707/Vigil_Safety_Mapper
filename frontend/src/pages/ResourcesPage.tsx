import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  ExternalLink,
  FileText,
  Heart,
  Phone,
  Scale,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import {
  DOWNLOAD_GUIDES,
  EXTERNAL_RESOURCE_LINKS,
  HELPLINES,
  RESOURCES,
  type ResourceIconKey,
} from '../data/resources';

const RESOURCE_ICONS: Record<ResourceIconKey, LucideIcon> = {
  legal: Scale,
  safety: Shield,
  'mental-health': Heart,
  'self-defense': Shield,
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <h1 className="mb-4 text-5xl font-black text-slate-900">Safety Resources</h1>
          <p className="mx-auto max-w-2xl text-slate-500">
            Explore step-by-step guidance, verified helplines, and downloadable checklists you can keep with you offline.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <div className="grid gap-8 md:grid-cols-2">
              {RESOURCES.map((resource) => {
                const Icon = RESOURCE_ICONS[resource.iconKey];

                return (
                  <motion.article
                    key={resource.slug}
                    whileHover={{ y: -5 }}
                    className="group rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm"
                  >
                    <div className={cn('mb-6 flex h-14 w-14 items-center justify-center rounded-2xl', resource.colorClass)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h2 className="text-xl font-bold text-slate-900">{resource.title}</h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {resource.readTime}
                      </span>
                    </div>
                    <p className="mb-8 text-sm leading-relaxed text-slate-500">{resource.description}</p>
                    <Link
                      to={`/resources/${resource.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 transition-colors hover:text-rose-700"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.article>
                );
              })}
            </div>

            <section className="rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm md:p-16">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Downloadable Guides</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
                    Each file is hosted locally with the app, so clicking any card will start a real download instead of landing on a placeholder.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {DOWNLOAD_GUIDES.map((file) => (
                  <a
                    key={file.slug}
                    href={file.href}
                    download={file.fileName}
                    className="group flex items-center justify-between rounded-2xl bg-slate-50 p-6 transition-all hover:bg-rose-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-colors group-hover:text-rose-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{file.name}</div>
                        <div className="mt-1 text-xs text-slate-400">{file.format}</div>
                        <div className="mt-2 text-sm text-slate-500">{file.description}</div>
                      </div>
                    </div>
                    <Download className="h-5 w-5 text-slate-300 transition-colors group-hover:text-rose-600" />
                  </a>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[2.5rem] bg-rose-600 p-10 text-white shadow-2xl shadow-rose-100">
              <h2 className="mb-8 flex items-center gap-3 text-2xl font-black">
                <Phone className="h-6 w-6" />
                Quick Helplines
              </h2>
              <div className="space-y-8">
                {HELPLINES.map((helpline) => (
                  <div key={helpline.number} className="border-b border-rose-500/30 pb-6 last:border-0 last:pb-0">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-rose-200">{helpline.name}</div>
                    <a
                      href={`tel:${helpline.number}`}
                      className="mb-1 block text-3xl font-black transition-colors hover:text-rose-100"
                    >
                      {helpline.number}
                    </a>
                    <div className="text-xs text-rose-200">{helpline.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-slate-900">Official External Links</h2>
              <div className="space-y-5">
                {EXTERNAL_RESOURCE_LINKS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-rose-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-700 transition-colors group-hover:text-rose-600">
                          {link.name}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{link.description}</p>
                      </div>
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-rose-600" />
                    </div>
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
