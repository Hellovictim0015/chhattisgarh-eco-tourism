import { Phone } from 'lucide-react';

// WhatsApp's own glyph (lucide has no brand icons)
export function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.04.7C5.77.7.67 5.8.67 12.06c0 2 .52 3.96 1.52 5.68L.57 23.7l6.1-1.6a11.33 11.33 0 0 0 5.37 1.37h.01c6.26 0 11.36-5.1 11.37-11.36 0-3.04-1.18-5.89-3.34-8.04z" />
    </svg>
  );
}

// https://wa.me link with a ready-made first message. 10-digit numbers are taken as Indian (+91).
export function whatsAppLink(number, text) {
  let digits = String(number || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// Call + WhatsApp buttons. Renders nothing for a number that is not set.
//   size: "md" (page header / booking panel) or "lg" (mobile bottom bar, buttons stretch)
export default function ContactButtons({ phone, whatsapp, message, size = 'md', className = '' }) {
  if (!phone && !whatsapp) return null;
  const base = size === 'lg'
    ? 'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold'
    : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold';
  return (
    <div className={`flex gap-2 ${className}`}>
      {phone && (
        <a href={`tel:${phone}`} className={`${base} border border-emerald-700 text-emerald-800 bg-white hover:bg-emerald-50 transition-colors`}>
          <Phone className="w-4 h-4" /> Call
        </a>
      )}
      {whatsapp && (
        <a
          href={whatsAppLink(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} bg-[#25D366] hover:bg-[#1ebe5a] text-white transition-colors`}
        >
          <WhatsAppIcon /> WhatsApp
        </a>
      )}
    </div>
  );
}
