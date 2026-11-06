const http = require('http');
const { URL } = require('url');
const { verify } = require('@noble/ed25519');
const { hexToBytes, utf8ToBytes } = require('@noble/hashes/utils.js');

const ERLC_WEBHOOK_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAjSICb9pp0kHizGQtdG8ySWsDChfGqi+gyFCttigBNOA=";

function extractWebhookSignatureHeaders(headers) {
  const timestamp = headers['x-signature-timestamp'];
  const signature = headers['x-signature-ed25519'];
  if (typeof timestamp !== 'string' || typeof signature !== 'string') {
    return null;
  }
  return { timestamp, signature };
}

async function verifyWebhookSignature(rawBody, headers) {
  try {
    // Build message: timestamp + raw_body
    const message = new Uint8Array([...utf8ToBytes(headers.timestamp), ...rawBody]);
    const signatureBytes = hexToBytes(headers.signature);
    const publicKeyBytes = Buffer.from(ERLC_WEBHOOK_PUBLIC_KEY_B64, 'base64');
    const rawPublicKey = publicKeyBytes.slice(-32);

    console.log('Verifying signature:', {
      timestamp: headers.timestamp,
      signatureLength: headers.signature.length,
      messageLength: message.length,
      publicKeyLength: rawPublicKey.length,
      signatureBytesLength: signatureBytes.length
    });

    const result = await verify(signatureBytes, message, rawPublicKey);
    console.log('Signature verification result:', result);
    return result;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  // Accept both / and /api/erlc paths
  if (url.pathname !== '/' && url.pathname !== '/api/erlc') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    return;
  }

  // Collect raw body bytes
  const chunks = [];
  req.on('data', chunk => {
    chunks.push(chunk);
  });

  req.on('end', async () => {
    try {
      const rawBody = Buffer.concat(chunks);
      const headers = extractWebhookSignatureHeaders(req.headers);

      console.log('ERLC webhook received:', {
        hasSignature: !!headers,
        bodyLength: rawBody.length,
        bodyPreview: rawBody.toString('utf8').substring(0, 100),
        timestamp: headers?.timestamp,
        signature: headers?.signature?.substring(0, 20) + '...'
      });

      // If no signature headers, return 401 (invalid probe)
      if (!headers) {
        console.log('No signature headers - returning 401');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Missing signature headers' }));
        return;
      }

      // Verify the Ed25519 signature
      const isValid = await verifyWebhookSignature(rawBody, headers);

      if (!isValid) {
        console.log('Invalid signature - returning 401');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid signature' }));
        return;
      }

      // Valid signature - parse and process
      console.log('Valid signature - returning 200');
      const payload = JSON.parse(rawBody.toString('utf8'));
      console.log('ERLC webhook payload:', payload);

      // For now, just acknowledge receipt
      // TODO: Forward to Discord with Components V2
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: { received: true } }));
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Verification failed' }));
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
