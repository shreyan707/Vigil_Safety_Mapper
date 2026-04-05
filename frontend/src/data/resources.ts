export type ResourceIconKey = 'legal' | 'safety' | 'mental-health' | 'self-defense';

export type ResourceSection = {
  title: string;
  items: string[];
};

export type ResourceArticle = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  iconKey: ResourceIconKey;
  colorClass: string;
  readTime: string;
  downloadSlug?: string;
  sections: ResourceSection[];
};

export type DownloadGuide = {
  slug: string;
  name: string;
  description: string;
  format: string;
  href: string;
  fileName: string;
};

export type ExternalResourceLink = {
  name: string;
  url: string;
  description: string;
};

export type Helpline = {
  name: string;
  number: string;
  desc: string;
};

export const RESOURCES: ResourceArticle[] = [
  {
    slug: 'legal-rights-guide',
    title: 'Legal Rights Guide',
    description: 'Understanding your rights under Indian law regarding domestic violence, harassment, and immediate reporting options.',
    intro: 'A practical overview of the first protections, reporting channels, and documentation steps survivors can use when they need legal support fast.',
    iconKey: 'legal',
    colorClass: 'bg-blue-50 text-blue-600',
    readTime: '6 min read',
    downloadSlug: 'legal-rights-handbook',
    sections: [
      {
        title: 'When legal protection can start immediately',
        items: [
          'You can seek help even if you do not have every document ready on day one. A complaint, incident record, or helpline referral can still begin the process.',
          'Domestic violence, stalking, sexual harassment, online harassment, dowry-related abuse, and threats can all be reported through formal channels.',
          'If there is immediate danger, prioritise emergency response and medical safety before collecting detailed paperwork.',
        ],
      },
      {
        title: 'What to document',
        items: [
          'Save screenshots, call logs, threatening messages, photos of injuries or damage, and dates, times, and names of witnesses when possible.',
          'Keep copies of any FIR, diary entry, medico-legal report, complaint acknowledgement, or referral slip you receive.',
          'Store evidence in more than one safe place, such as your phone plus a trusted email account or a trusted contact.',
        ],
      },
      {
        title: 'Where to escalate',
        items: [
          'Use local police or emergency services for urgent threats and violence in progress.',
          'Use the National Commission for Women portal and state support systems when you need complaint escalation or guidance.',
          'Use the cybercrime portal for online blackmail, impersonation, stalking, or image-based abuse.',
        ],
      },
    ],
  },
  {
    slug: 'safety-planning',
    title: 'Safety Planning',
    description: 'Practical steps to create a personal safety plan for you, your children, and the people who may need to help you quickly.',
    intro: 'Safety plans work best when they are simple, rehearsed, and built around what you can realistically do under stress.',
    iconKey: 'safety',
    colorClass: 'bg-rose-50 text-rose-600',
    readTime: '5 min read',
    downloadSlug: 'safety-planning-worksheet',
    sections: [
      {
        title: 'Build a quick-exit plan',
        items: [
          'Choose one or two safe places you can go at any hour and decide how you would get there.',
          'Keep emergency cash, medicines, ID copies, phone charger, and important numbers in one ready-to-grab bag.',
          'Teach children a simple safety script such as who to call, where to go, and what code word means they must leave with you.',
        ],
      },
      {
        title: 'Reduce decision-making in a crisis',
        items: [
          'Save emergency contacts as favourites so you can reach them with as few taps as possible.',
          'Keep one trusted person updated on changes in routine, threats, or locations when a situation is escalating.',
          'Identify the safest room in a home or building, ideally one with an exit and fewer objects that can be used as weapons.',
        ],
      },
      {
        title: 'Review the plan regularly',
        items: [
          'Update contact numbers, transport options, and safe addresses if your circumstances change.',
          'Practice the plan enough that it feels automatic, especially if children or elders depend on you.',
          'Replace missing documents, medicines, and essentials in your emergency kit as soon as you use them.',
        ],
      },
    ],
  },
  {
    slug: 'mental-health-support',
    title: 'Mental Health Support',
    description: 'Resources for coping with trauma, anxiety, disrupted sleep, and the emotional fallout that often follows violence or harassment.',
    intro: 'Emotional recovery is part of safety. Stabilising your body and routine can make it easier to ask for help, think clearly, and make decisions.',
    iconKey: 'mental-health',
    colorClass: 'bg-emerald-50 text-emerald-600',
    readTime: '4 min read',
    downloadSlug: 'mental-health-recovery-guide',
    sections: [
      {
        title: 'First-response grounding',
        items: [
          'Try short grounding steps like naming five things you can see, slowing your breathing, or placing both feet firmly on the floor.',
          'Reduce stimulation when possible by moving to a quieter space, muting repeated notifications, and stepping away from upsetting media.',
          'If you feel overwhelmed, focus on one immediate need at a time: hydration, medication, food, rest, or a trusted call.',
        ],
      },
      {
        title: 'Daily support habits',
        items: [
          'Keep meals, sleep windows, and check-ins as regular as possible even when the rest of life feels unstable.',
          'Write down intrusive thoughts or tasks instead of holding them in memory all day.',
          'Reach out to a counselor, psychologist, psychiatrist, or trained support worker when fear, panic, or dissociation starts affecting daily functioning.',
        ],
      },
      {
        title: 'When to seek urgent care',
        items: [
          'Seek immediate medical or crisis support if you feel unsafe with yourself, cannot stay oriented, or are unable to care for basic needs.',
          'Ask a trusted person to stay with you or help coordinate appointments if you feel exhausted or shut down.',
          'Combine emotional support with legal and physical safety planning when the source of harm is still active.',
        ],
      },
    ],
  },
  {
    slug: 'self-defense-tips',
    title: 'Self Defense Tips',
    description: 'Basic awareness, boundary-setting, and last-resort physical response ideas for personal safety in public spaces.',
    intro: 'Personal safety starts with awareness, distance, and exit opportunities. Physical techniques are a last resort when escape is not immediately available.',
    iconKey: 'self-defense',
    colorClass: 'bg-amber-50 text-amber-600',
    readTime: '4 min read',
    downloadSlug: 'self-defense-awareness-checklist',
    sections: [
      {
        title: 'Prevention comes first',
        items: [
          'Trust early discomfort signals and change direction, call someone, or enter a public place sooner rather than later.',
          'Keep your phone charged and avoid having both ears blocked by audio in unfamiliar or low-visibility areas.',
          'Share live location with a trusted contact when travelling late or when an interaction feels unsafe.',
        ],
      },
      {
        title: 'Use your voice and space',
        items: [
          'A loud, direct command like stop, back away, or call the police can draw attention and disrupt an attacker’s momentum.',
          'Keep as much distance as possible and angle toward exits, crowds, security desks, shops, or well-lit transport points.',
          'If someone is following or pressuring you, move toward witnesses instead of trying to handle it alone in a quieter space.',
        ],
      },
      {
        title: 'If escape is blocked',
        items: [
          'Prioritise creating enough space to run rather than trying to stay and win a confrontation.',
          'Aim for simple high-value targets such as the eyes, nose, throat, or groin only to break contact and get away.',
          'Report the incident quickly afterwards while details, appearance, route, and timing are still fresh.',
        ],
      },
    ],
  },
];

export const DOWNLOAD_GUIDES: DownloadGuide[] = [
  {
    slug: 'legal-rights-handbook',
    name: 'Legal Rights Handbook',
    description: 'A printable summary of first legal steps, evidence preservation, and official reporting channels.',
    format: 'Printable HTML guide',
    href: '/downloads/legal-rights-handbook.html',
    fileName: 'vigil-legal-rights-handbook.html',
  },
  {
    slug: 'safety-planning-worksheet',
    name: 'Safety Planning Worksheet',
    description: 'A fillable planning guide for emergency contacts, safe locations, transport, and essentials.',
    format: 'Printable HTML worksheet',
    href: '/downloads/safety-planning-worksheet.html',
    fileName: 'vigil-safety-planning-worksheet.html',
  },
  {
    slug: 'mental-health-recovery-guide',
    name: 'Mental Health Recovery Guide',
    description: 'A short recovery guide covering grounding, rest, support check-ins, and professional care prompts.',
    format: 'Printable HTML guide',
    href: '/downloads/mental-health-recovery-guide.html',
    fileName: 'vigil-mental-health-recovery-guide.html',
  },
  {
    slug: 'self-defense-awareness-checklist',
    name: 'Self-Defense Awareness Checklist',
    description: 'A compact checklist focused on awareness, exit planning, and public-space response habits.',
    format: 'Printable HTML checklist',
    href: '/downloads/self-defense-awareness-checklist.html',
    fileName: 'vigil-self-defense-awareness-checklist.html',
  },
];

export const EXTERNAL_RESOURCE_LINKS: ExternalResourceLink[] = [
  {
    name: 'National Commission for Women',
    url: 'https://www.ncw.gov.in/',
    description: 'Official commission resources, complaint pathways, and support information.',
  },
  {
    name: 'Ministry of Women and Child Development',
    url: 'https://www.wcd.gov.in/',
    description: 'Government schemes, women safety initiatives, and public welfare resources.',
  },
  {
    name: 'National Cyber Crime Reporting Portal',
    url: 'https://cybercrime.gov.in/',
    description: 'Official reporting portal for cyber harassment, impersonation, fraud, and digital abuse.',
  },
];

export const HELPLINES: Helpline[] = [
  { name: 'National Women Helpline', number: '181', desc: '24/7 distress support' },
  { name: 'Women Helpline (Domestic)', number: '1091', desc: 'Support for domestic violence and harassment' },
  { name: 'Police Emergency', number: '100', desc: 'Immediate police response' },
  { name: 'Cyber Crime Helpline', number: '1930', desc: 'Urgent reporting for cyber fraud and online abuse' },
];

export function getResourceBySlug(slug: string) {
  return RESOURCES.find((resource) => resource.slug === slug);
}

export function getDownloadGuideBySlug(slug: string) {
  return DOWNLOAD_GUIDES.find((guide) => guide.slug === slug);
}
