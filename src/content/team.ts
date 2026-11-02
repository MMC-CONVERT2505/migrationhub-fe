/** The team and offices, copied word for word from https://www.mmcconvert.com/team. Keep the two in step. */
export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio: string[];
  linkedin: string;
  /** International number, digits only (no "+"): used for the wa.me chat link. */
  whatsapp: string;
}

export const TEAM: TeamMember[] = [
  {
    name: 'Ankit Mehta',
    role: 'Founder',
    photo: '/static/team/ankit-mehta.jpg',
    bio: [
      "He is a global cloud accounting entrepreneur, best known for building one of the world's most advanced accounting data-migration platforms. As Founder of the MMC Group, he leads a technology-first organisation operating across six regions worldwide.",
      'A third-generation Chartered Accountant, he combines deep knowledge of the accounting profession with a technology-driven approach, having built AI-powered accounting infrastructure used by more than 100,000 businesses.',
      'He also leads the Arth Sangini Foundation, delivering pro-bono accounting and governance support to non-profits including UNICEF and UN Women.',
    ],
    linkedin: 'https://www.linkedin.com/in/ankit-mehta-a484176/',
    whatsapp: '919926477000',
  },
  {
    name: 'Shanu Mehta',
    role: 'Co-Founder',
    photo: '/static/team/shanu-mehta.jpg',
    bio: [
      "She is a visionary entrepreneur and Computer Engineer from Neemuch, Madhya Pradesh. She co-founded MMC Convert, now ranked #245 among America's fastest-growing companies by Inc.com, and is deeply involved in building automation tools that migrate businesses seamlessly from one software to another.",
      'A Professor of Entrepreneurship at IIM Indore for eight years and visiting faculty at Mesoyios College, Cyprus, she mentors emerging founders to blend innovation with impact, bridging business, education and empowerment.',
      "She is a Forbes Business Council member, a World Economic Forum delegate and a women's empowerment advocate who has personally mentored over 100 women toward financial literacy - representing the new face of Indian entrepreneurship: resilient, innovative and globally relevant.",
    ],
    linkedin: 'https://www.linkedin.com/in/shanu-mehta-37861a105/',
    whatsapp: '919926477000',
  },
  {
    name: 'Meagan Wood',
    role: 'Marketing Advisor',
    photo: '/static/team/meagan-wood.jpg',
    bio: [
      'Meagan brings more than 30 years of experience in product marketing and strategy to the MMC Convert team. With a background in accounting and programming technology, she has led the product marketing function for leading technology companies including Solution 6, MYOB, BankLink and Intuit.',
      'Her expertise spans go-to-market strategy, positioning and messaging across Australia, New Zealand and the broader APAC region.',
      "As MMC Convert's Marketing Advisor, Meagan brings a deep understanding of the accounting technology landscape and the needs of accountants, bookkeepers and businesses. She helps translate complex technology into clear, compelling value for customers.",
    ],
    linkedin: 'https://www.linkedin.com/in/meagan-woodau/',
    whatsapp: '61402900868',
  },
  {
    name: 'Meena Berry',
    role: 'AU Partnerships Advisor',
    photo: '/static/team/meena-berry.jpg',
    bio: [
      'Meena is a partnerships and ecosystem leader with 20 years of experience across technology, SaaS and accounting software. Her career spans Xero, PwC and fintech. She has built strategic partnerships with accounting firms, software ecosystems and major Australian retail and franchise networks.',
      "As MMC Convert's AU Partnerships Advisor, Meena builds relationships with accountants, bookkeepers, software providers, implementation consultants and franchise groups. She connects MMC's migration expertise with the businesses and partner networks that need it. She helps partners remove the barriers to switching systems, simplify client onboarding and coordinate migrations across multiple entities.",
    ],
    linkedin: 'https://www.linkedin.com/in/meenaberry/',
    whatsapp: '61448054412',
  },
  {
    name: 'Gavin Fernandes',
    role: 'Growth Advisor',
    photo: '/static/team/gavin-fernandes.jpg',
    bio: [
      'Gavin is a senior growth and commercial leader with more than 25 years of experience across Australia, the UK and India. He helps technology and financial services businesses build markets, accelerate revenue and create lasting strategic value.',
      'As Growth Advisor to MMC Convert, Gavin works closely with the leadership team to define growth strategy, unlock new market opportunities, build high-value partnerships and drive commercial execution.',
      'His experience across MYOB, Xero, Workday and Fathom brings deep expertise in the accounting technology ecosystem. His leadership approach is grounded in strategic thinking, strong relationships and a relentless focus on turning opportunity into sustainable growth.',
    ],
    linkedin: 'https://www.linkedin.com/in/gavinfernandes1',
    whatsapp: '61450466343',
  },
];

export const OFFICES: Array<{ region: string; address: string }> = [
  { region: 'USA', address: '1250 N Lasalle Street Chicago. 60610, USA' },
  { region: 'AUSTRALIA', address: 'Level 1, 1034 Dandenong Rd Carnegie, VIC 3163, Australia' },
  { region: 'UK', address: 'Babel Studios 82 Southwark, Bridge Road, London' },
  { region: 'Dubai', address: 'PO Box 56754 Dubai, UAE' },
  { region: 'India', address: 'Hotel Shringar Private Limited, 163 RNT MARG, Indore, M.P., 452001, INDIA' },
];
