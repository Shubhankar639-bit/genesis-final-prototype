export interface Source {
  short: string; // Label used in visible inline citations
  title: string;
  authors?: string;
  publisher: string;
  date: string; // Year, or "Not stated on page"
  kind: string; // Source type, shown in Section G
  url: string;
  supports?: string;
}

// Keys are used as inline markers such as {{li2023}} inside answer text.
// Source metadata and the cited findings were checked against the original publications on 2026-10-14.
export const SOURCES: Record<string, Source> = {
  li2023: {
    supports: "Section A and FAQ: modeled direct cooling water for GPT-3; consumption versus withdrawal and indirect electricity-related water.",
    short: 'Li et al., 2023',
    title: "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models",
    authors: 'Pengfei Li, Jianyi Yang, Mohammad A. Islam, Shaolei Ren',
    publisher: 'arXiv (arXiv:2304.03271)',
    date: '6 April 2023 (first submitted)',
    kind: 'Preprint, academic',
    url: 'https://arxiv.org/abs/2304.03271',
  },
  patterson2021: {
    supports: "Section B and FAQ: GPT-3 training energy and operational emissions, Table 4; excludes equipment manufacturing.",
    short: 'Patterson et al., 2021',
    title: 'Carbon Emissions and Large Neural Network Training',
    authors:
      'David Patterson, Joseph Gonzalez, Quoc Le, Chen Liang, Lluis-Miquel Munguia, Daniel Rothchild, David So, Maud Texier, Jeff Dean',
    publisher: 'arXiv (arXiv:2104.10350)',
    date: '21 April 2021 (first submitted)',
    kind: 'Preprint, academic',
    url: 'https://arxiv.org/abs/2104.10350',
  },
  luccioni2024: {
    supports: "Section E: image-generation benchmark energy, Table 2; mean per 1,000 inferences and variability.",
    short: 'Luccioni et al., 2024',
    title: 'Power Hungry Processing: Watts Driving the Cost of AI Deployment?',
    authors: 'Alexandra Sasha Luccioni, Yacine Jernite, Emma Strubell',
    publisher: 'ACM FAccT 2024 (preprint on arXiv:2311.16863)',
    date: '2024 (conference); arXiv 2023',
    kind: 'Peer-reviewed conference paper',
    url: 'https://arxiv.org/abs/2311.16863',
  },
  elsworth2025: {
    supports: "Sections C and E: Table 2, May 2025 Gemini Apps median prompt; measured serving energy and estimated cooling water.",
    short: 'Elsworth et al., 2025',
    title: 'Measuring the environmental impact of delivering AI at Google Scale',
    authors: 'Cooper Elsworth, Keguo Huang, David Patterson, Ian Schneider, Robert Sedivy, Savannah Goodman, Ben Townsend, Parthasarathy Ranganathan, Jeff Dean, Amin Vahdat, Ben Gomes, James Manyika',
    publisher: 'Google; arXiv (arXiv:2508.15734)',
    date: '21 August 2025',
    kind: 'Vendor-authored preprint; not an independent audit',
    url: 'https://arxiv.org/abs/2508.15734',
  },
  doeCooling: {
    short: 'US DOE, Cooling Tower Management',
    title: 'Best Management Practice #10: Cooling Tower Management',
    publisher: 'US Department of Energy, Federal Energy Management Program',
    date: 'No publication date displayed',
    kind: 'Official operational guidance',
    url: 'https://www.energy.gov/cmei/femp/best-management-practice-10-cooling-tower-management',
    supports: 'Section C: evaporation, blowdown, treatment, maintenance, and alternative make-up water sources.',
  },
  unSdg6: {
    supports: "Section D: official wording of Target 6.6 and indicator 6.6.1; not evidence of impacts at a specific data centre.",
    short: 'UN SDG 6',
    title: 'Goal 6: Ensure availability and sustainable management of water and sanitation for all',
    publisher: 'United Nations, Sustainable Development Goals',
    date: 'Not stated on page',
    kind: 'Official UN resource',
    url: 'https://sdgs.un.org/goals/goal6',
  },
  unIndicator661: {
    supports: "Section D: indicator methodology for tracking changes in water-related ecosystems.",
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
      "Estimates vary by model and location. Li et al. model approximately 700,000 litres of freshwater for training GPT-3 in Microsoft's US data centres, mostly for cooling {{li2023}}. Comparable estimates for other models are limited, and totals depend on hardware, climate, and cooling design.",
  },
  {
    id: 'faq-training-carbon',
    question: 'What is the carbon footprint of AI model training?',
    answer:
      'Published training estimates for GPT-3 put energy near 1,287 MWh and emissions near 552 tonnes of CO2-equivalent (CO2e) {{patterson2021}}. These figures cover the training run only, excluding inference and hardware manufacturing. Results depend on electricity carbon intensity, hardware efficiency, and data-centre overheads.',
  },
  {
    id: 'faq-inference-water',
    question: 'Does AI inference consume water?',
    answer:
      'Yes. AI inference can consume water through data-centre cooling and electricity generation {{li2023}}. There is no universal per-prompt amount: cooling technology, climate, model workload, and accounting boundaries change the result. Training and inference are different activities, so a training estimate cannot describe the water consumed by a single response.',
  },
  {
    id: 'faq-reduce-impact',
    question: 'How can data centres reduce their environmental impact?',
    answer:
      'Operators can reduce impact by siting facilities where electricity is low-carbon and water is abundant, improving hardware utilization, raising cooling efficiency, and using reclaimed or closed-loop water where feasible. Transparent, location-specific reporting of both energy and water lets researchers and communities verify progress. Assess local water and energy trade-offs {{doeCooling}}.',
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
