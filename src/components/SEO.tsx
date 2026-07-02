interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  schema?: Record<string, unknown>;
  url?: string;
  image?: string;
  type?: string;
}

export default function SEO({
  title = 'PunyaSendiri — Registrasi & Transfer Domain Termurah',
  description = 'Daftarkan, transfer, dan perpanjang nama domain Anda dengan harga paling kompetitif di PunyaSendiri by Ruangtunggu.',
  keywords = 'domain murah, beli domain, transfer domain, perpanjang domain, ruangtunggu, punyasendiri',
  schema,
  url = 'https://punyasendiri.com',
  image = 'https://punyasendiri.com/og-image.jpg',
}: SEOProps) {
  // Default Organization & WebSite schema
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url: url,
        name: 'PunyaSendiri',
        description: description,
        publisher: {
          '@id': `${url}/#organization`,
        },
      },
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: 'PunyaSendiri by Ruangtunggu',
        url: url,
        logo: image,
      },
      // Append any specific schema passed via props
      ...(schema ? [schema] : []),
    ],
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">{JSON.stringify(defaultSchema)}</script>
    </>
  );
}
