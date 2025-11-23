/**
 * Google Tag Manager Body Component
 * Place this immediately after the opening <body> tag
 */

interface GTMBodyProps {
  gtmId?: string;
}

export default function GTMBody({ gtmId }: GTMBodyProps) {
  const GTM_ID = gtmId || process.env.NEXT_PUBLIC_GTM_ID || 'GTM-M67P6XS7';

  if (!GTM_ID) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
      {/* End Google Tag Manager (noscript) */}
    </>
  );
}

