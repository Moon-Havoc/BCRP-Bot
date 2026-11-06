const http = require('http');
const { URL } = require('url');

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

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/api/erlc') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Check for signature headers
      const signature = req.headers['x-signature-ed25519'];
      const timestamp = req.headers['x-signature-timestamp'];
      const hasSignature = signature && timestamp;

      console.log('ERLC webhook received:', {
        hasSignature,
        signature: signature,
        timestamp: timestamp,
        body: body
      });

      // If no signature headers, return 401 (invalid probe)
      if (!hasSignature) {
        console.log('No signature headers - returning 401 for probe validation');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Missing signature headers' }));
        return;
      }

      // Validate signature format (should be hex string)
      const isValidSignatureFormat = /^[0-9a-fA-F]+$/.test(signature) && signature.length > 0;
      const isValidTimestamp = !isNaN(parseInt(timestamp, 10));

      if (!isValidSignatureFormat || !isValidTimestamp) {
        console.log('Invalid signature format - returning 401');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid signature format' }));
        return;
      }

      // Valid signature headers - this is the valid probe, return 200
      console.log('Valid signature headers - returning 200 for valid probe');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: { received: true } }));
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, data: { received: true, error: 'logged' } }));
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
