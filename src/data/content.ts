export interface Source {
  short: string; // Label used in visible inline citations
  title: string;
  authors?: string;
  publisher: string;
  date: string; // Year, or "Not stated on page"
  kind: string; // Source type, shown in Section G
  url: string;
}

// Keys are used as inline markers such as {{li2023}} inside answer text.
// All entries must be re-verified against the original before publication.
export const SOURCES: Record<string, Source> = {
  li2023: {
    short: 'Li et al., 2023',
    title: "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models",
    authors: 'Pengfei Li, Jianyi Yang, Mohammad A. Islam, Shaolei Ren',
    publisher: 'arXiv (arXiv:2304.03271)',
    date: '2023',
    kind: 'Preprint, academic',
    url: 'https://arxiv.org/abs/2304.03271',
  },
  patterson2021: {
    short: 'Patterson et al., 2021',
    title: 'Carbon Emissions and Large Neural Network Training',
    authors:
      'David Patterson, Joseph Gonzalez, Quoc Le, Chen Liang, Lluis-Miquel Munguia, Daniel Rothchild, David So, Maud Texier, Jeff Dean',
    publisher: 'arXiv (arXiv:2104.10350)',
    date: '2021',
    kind: 'Preprint, academic',
    url: 'https://arxiv.org/abs/2104.10350',
  },
  luccioni2024: {
    short: 'Luccioni et al., 2024',
    title: 'Power Hungry Processing: Watts Driving the Cost of AI Deployment?',
    authors: 'Alexandra Sasha Luccioni, Yacine Jernite, Emma Strubell',
    publisher: 'ACM FAccT 2024 (preprint on arXiv:2311.16863)',
    date: '2024 (conference); arXiv 2023',
    kind: 'Peer-reviewed conference paper',
    url: 'https://arxiv.org/abs/2311.16863',
  },
  elsworth2025: {
    short: 'Elsworth et al., 2025',
    title: 'Measuring the environmental impact of delivering AI at Google Scale',
    authors: 'Elsworth et al. (Google)',
    publisher: 'Google; arXiv (arXiv:2508.15734)',
    date: '2025',
    kind: 'Vendor technical report (preprint). Verify before use.',
    url: 'https://arxiv.org/abs/2508.15734',
  },
  unSdg6: {
    short: 'UN SDG 6',
    title: 'Goal 6: Ensure availability and sustainable management of water and sanitation for all',
    publisher: 'United Nations, Sustainable Development Goals',
    date: 'Not stated on page',
    kind: 'Official UN resource',
    url: 'https://sdgs.un.org/goals/goal6',
  },
  unIndicator661: {
    short: 'UN SDG indicator 6.6.1',
    title: 'SDG indicator metadata (indicator 6.6.1: change in the extent of water-related ecosystems over time)',
    publisher: 'United Nations Statistics Division',
    date: 'Not stated on page',
    kind: 'Official UN metadata',
    url: 'https://unstats.un.org/sdgs/metadata/',
  },
};

export interface Faq {
  id: string;
  question: string;
  answer: string; // Plain text with {{sourceKey}} markers for inline citations
}

// Shared by the visible FAQ section and the FAQPage JSON-LD so they cannot drift apart.
export const FAQS: Faq[] = [
  {
    id: 'faq-training-water',
    question: 'How much water does training an LLM consume?',
    answer:
      "Estimates vary by model and location. The most-cited academic figure is about 700,000 litres of freshwater for training GPT-3 in Microsoft's US data centres, mostly for cooling {{li2023}}. Comparable estimates for other models are limited, and totals depend on hardware, climate, and cooling design.",
  },
  {
    id: 'faq-training-carbon',
    question: 'What is the carbon footprint of AI model training?',
    answer:
      'Published training estimates for GPT-3 put energy near 1,287 MWh and emissions near 552 tonnes of CO2-equivalent (CO2e) {{patterson2021}}. These figures cover the training run only, excluding inference and hardware manufacturing. Results depend on electricity carbon intensity, hardware efficiency, and data-centre overheads.',
  },
  {
    id: 'faq-inference-water',
    question: 'How much water does AI inference consume?',
    answer:
      'Yes. Inference uses water indirectly through electricity generation and directly when data centres use evaporative cooling for the servers running models. Per-request amounts are small, but they repeat across very large volumes of use. Public per-query measurements are sparse and use inconsistent boundaries, so totals remain uncertain.',
  },
  {
    id: 'faq-reduce-impact',
    question: 'How can data centres reduce their environmental impact?',
    answer:
      'Operators can reduce impact by siting facilities where electricity is low-carbon and water is abundant, improving hardware utilization, raising cooling efficiency, and using reclaimed or closed-loop water where feasible. Transparent, location-specific reporting of both energy and water lets researchers and communities verify progress. Trade-offs between water and energy should be assessed locally.',
  },
];

const markerPattern = /\{\{(\w+)\}\}/g;

function sourceFor(key: string): Source {
  const source = SOURCES[key];
  if (!source) throw new Error(`Unknown source marker: {{${key}}}`);
  return source;
}

/** HTML for visible answers: each marker becomes a linked citation in parentheses. */
export function answerHtml(answer: string): string {
  return answer.replace(markerPattern, (_m, key: string) => {
    const s = sourceFor(key);
    return `(<a href="${s.url}">${s.short}</a>)`;
  });
}

/** Plain text for JSON-LD: same wording as the visible answer, without markup. */
export function answerText(answer: string): string {
  return answer.replace(markerPattern, (_m, key: string) => `(${sourceFor(key).short})`);
}
