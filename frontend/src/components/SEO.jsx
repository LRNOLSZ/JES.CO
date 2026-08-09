import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, jsonLd }) {
  const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(block)}</script>
      ))}
    </Helmet>
  )
}
