// api/delete-image.js
// ─────────────────────────────────────────────────────────────
// Vercel Blob'dan görsel sil
// DELETE /api/delete-image
// Body JSON: { url: "https://..." }
// ─────────────────────────────────────────────────────────────
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN eksik' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const { url } = JSON.parse(Buffer.concat(chunks).toString());

    if (!url) return res.status(400).json({ error: 'url alanı eksik' });

    // Yalnızca kendi blob URL'lerimizi silebiliriz
    if (!url.includes('vercel-storage.com') && !url.includes('blob.vercel-storage')) {
      return res.status(400).json({ error: 'Geçersiz Blob URL' });
    }

    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });

    return res.status(200).json({ success: true, deleted: url });

  } catch (err) {
    console.error('[delete-image]', err);
    return res.status(500).json({ error: err.message || 'Silme başarısız' });
  }
}
