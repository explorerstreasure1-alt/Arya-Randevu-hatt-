// api/upload-image.js
// POST /api/upload-image
// Body JSON: { base64: "data:image/jpeg;base64,...", serviceId }
// Returns:   { success: true, url: "https://public-cdn.vercel-storage.com/..." }

import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN eksik. Vercel > Settings > Environment Variables kismina ekle.'
    });
  }

  try {
    // Body'yi raw stream olarak oku (bodyParser: false)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    if (!body.base64) {
      return res.status(400).json({ error: 'base64 alani zorunlu' });
    }

    // "data:image/jpeg;base64,/9j/..." formatini parse et
    const match = body.base64.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) {
      return res.status(400).json({ error: 'Gecersiz base64 formati' });
    }

    const mimeType    = match[1];                    // "image/jpeg"
    const imageBuffer = Buffer.from(match[2], 'base64');
    const ext         = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const filename    = `arya/services/${Date.now()}-${body.serviceId || 'img'}.${ext}`;

    // Vercel Blob'a yukle — kalici public URL
    const blob = await put(filename, imageBuffer, {
      access:      'public',
      contentType: mimeType,
      token:       process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({
      success: true,
      url:     blob.url,             // "https://xxxx.public.blob.vercel-storage.com/..."
      size:    imageBuffer.length,
    });

  } catch (err) {
    console.error('[upload-image]', err);
    return res.status(500).json({ error: err.message || 'Yukleme basarisiz' });
  }
}
