// Footer content used until the admin saves their own (Admin -> Footer).
// Shared by the server (settings API) and the browser (footer before settings load).
export const SOCIAL_NETWORKS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'linkedin', label: 'LinkedIn' },
];

export const DEFAULT_FOOTER = {
  about: 'Book hotels, resorts and eco stays across Chhattisgarh — pay at the hotel.',
  email: '',
  address: 'Chhattisgarh, India',
  hours: 'Mon – Sat, 9 AM – 8 PM',
  disclaimer:
    'Hotel details, photos and prices are provided by the hotels themselves. Bookings are confirmed by the hotel and payment is made directly at the property. Please carry a valid ID at check-in.',
  copyright: '',
  columns: [
    {
      title: 'Stays',
      links: [
        { label: 'All Hotels & Stays', href: '/hotels' },
        { label: 'Resorts', href: '/hotels?type=RESORT' },
        { label: 'Eco Lodges', href: '/hotels?type=ECO_LODGE' },
        { label: 'Homestays', href: '/hotels?type=HOMESTAY' },
      ],
    },
    {
      title: 'For Guests',
      links: [
        { label: 'My Bookings', href: '/my-bookings' },
        { label: 'My Profile', href: '/profile' },
        { label: 'Login / Register', href: '/login' },
      ],
    },
    {
      title: 'For Hotel Owners',
      links: [
        { label: 'List Your Hotel', href: '/my-hotels', badge: 'FREE' },
        { label: 'Manage Bookings', href: '/my-hotels' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Contact Us', href: '/contact' },
      ],
    },
  ],
  socials: { facebook: '', instagram: '', youtube: '', x: '', linkedin: '' },
};

const text = (v, max) => String(v ?? '').trim().slice(0, max);

// Only site paths ("/hotels"), http(s) links, mailto: and tel: are allowed as link targets
export function safeHref(v) {
  const s = text(v, 500);
  return /^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(s) ? s : '';
}

// Cleans footer data from the admin (or the database) into the shape the footer expects
export function normalizeFooter(input) {
  const f = input && typeof input === 'object' ? input : {};
  const columns = (Array.isArray(f.columns) ? f.columns : DEFAULT_FOOTER.columns)
    .slice(0, 6)
    .map((c) => ({
      title: text(c?.title, 60),
      links: (Array.isArray(c?.links) ? c.links : [])
        .slice(0, 12)
        .map((l) => ({ label: text(l?.label, 60), href: safeHref(l?.href), badge: text(l?.badge, 12) }))
        .filter((l) => l.label && l.href),
    }))
    .filter((c) => c.title || c.links.length);
  const socials = {};
  for (const { key } of SOCIAL_NETWORKS) socials[key] = /^https?:\/\//i.test(text(f.socials?.[key], 300)) ? text(f.socials[key], 300) : '';
  const field = (key, max) => (f[key] === undefined ? DEFAULT_FOOTER[key] : text(f[key], max));
  return {
    about: field('about', 300),
    email: field('email', 150),
    address: field('address', 300),
    hours: field('hours', 100),
    disclaimer: field('disclaimer', 1000),
    copyright: field('copyright', 200),
    columns,
    socials,
  };
}
