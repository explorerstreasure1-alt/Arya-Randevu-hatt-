// api/upload-image.js
// ─────────────────────────────────────────────────────────────
// Vercel Blob'a görsel yükle
// POST /api/upload-image
// Body: multipart/form-data → field: "image" (file)
//       veya JSON → { base64, filename, serviceId }
// ─────────────────────────────────────────────────────────────
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false, // raw stream okuyacağız
  },
};

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // BLOB_READ_WRITE_TOKEN Vercel ortam değişkeninden gelir
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN tanımlı değil. Vercel > Settings > Environment Variables kısmına ekleyin.'
    });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    let imageBuffer;
    let filename;
    let mimeType;

    if (contentType.includes('application/json')) {
      // ── JSON yolu: { base64: "data:image/jpeg;base64,...", filename, serviceId }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());

      if (!body.base64) return res.status(400).json({ error: 'base64 alanı eksik' });

      // "data:image/jpeg;base64,/9j/..." formatını parse et
      const match = body.base64.match(/^data:(.+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: 'Geçersiz base64 formatı' });

      mimeType    = match[1];                         // "image/jpeg"
      imageBuffer = Buffer.from(match[2], 'base64');
      const ext   = mimeType.split('/')[1] || 'jpg';
      filename    = body.filename || `service-${body.serviceId || Date.now()}.${ext}`;

    } else if (contentType.includes('multipart/form-data')) {
      // ── Multipart yolu (form upload)
      // Vercel'de native multipart parser kullanıyoruz
      const { Readable } = await import('stream');
      const busboy = (await import('busboy')).default;

      const bb = busboy({ headers: req.headers });
      const fileData = await new Promise((resolve, reject) => {
        let chunks = [];
        let name   = 'upload.jpg';
        let mime   = 'image/jpeg';
        bb.on('file', (fieldname, file, info) => {
          name = info.filename || name;
          mime = info.mimeType || mime;
          file.on('data', (d) => chunks.push(d));
          file.on('end',  () => resolve({ buffer: Buffer.concat(chunks), name, mime }));
        });
        bb.on('error', reject);
        req.pipe(bb);
      });

      imageBuffer = fileData.buffer;
      filename    = fileData.name;
      mimeType    = fileData.mime;

    } else {
      return res.status(400).json({ error: 'Desteklenmeyen Content-Type' });
    }

    // ── Vercel Blob'a yükle
    const safeName = `arya/services/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const blob = await put(safeName, imageBuffer, {
      access:      'public',          // herkese açık URL
      contentType: mimeType,
      token:       process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({
      success: true,
      url:     blob.url,             // kalıcı Vercel Blob URL'si
      size:    imageBuffer.length,
    });

  } catch (err) {
    console.error('[upload-image]', err);
    return res.status(500).json({ error: err.message || 'Yükleme başarısız' });
  }
}
