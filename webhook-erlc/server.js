const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

const ERLC_WEBHOOK_PUBLIC_KEY_B64 = "MCowBQYDK2VwAyEAjSICb9pp0kHizGQtdG8ySWsDChfGqi+gyFCttigBNOA=";

function extractWebhookSignatureHeaders(headers) {
  const timestamp = headers['x-signature-timestamp'];
  const signature = headers['x-signature-ed25519'];
  if (typeof timestamp !== 'string' || typeof signature !== 'string') {
    return null;
  }
  return { timestamp, signature };
}

function verifyWebhookSignature(rawBody, headers) {
  try {
    // Build message: timestamp + raw_body
    const timestampBytes = Buffer.from(headers.timestamp, 'utf8');
    const message = Buffer.concat([timestampBytes, rawBody]);
    
    // Decode signature from hex
    const signatureBytes = Buffer.from(headers.signature, 'hex');
    
    // Decode public key from base64
    const publicKeyBytes = Buffer.from(ERLC_WEBHOOK_PUBLIC_KEY_B64, 'base64');
    const rawPublicKey = publicKeyBytes.slice(-32);
    
    console.log('Verifying signature:', {
      timestamp: headers.timestamp,
      signatureLength: headers.signature.length,
      messageLength: message.length,
      publicKeyLength: rawPublicKey.length,
      signatureBytesLength: signatureBytes.length
    });

    // Create public key object from raw bytes
    const publicKey = crypto.createPublicKey({
      key: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: rawPublicKey.toString('base64')
      },
      format: 'jwk'
    });

    // Verify signature
    const isValid = crypto.verify(null, message, publicKey, signatureBytes);
    console.log('Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1568088136700137502/KBxLMC5Hce2L2fRsu0ti5aHNYu4Z_4iFfgRm_1m56xewO8XfNURGyJL5OQtpgYvGU_E8';

async function forwardToDiscord(payload) {
  try {
    const events = payload.events || [];
    
    for (const event of events) {
      const embed = createDiscordEmbed(event);
      if (!embed) continue; // Skip probe events
      
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      
      console.log('Forwarded event to Discord:', event.event);
    }
  } catch (error) {
    console.error('Failed to forward to Discord:', error);
  }
}

function createDiscordEmbed(event) {
  const eventType = event.event || 'unknown';
  const data = event.data || {};
  const timestamp = event.timestamp ? new Date(event.timestamp * 1000) : new Date();
  
  // Determine embed color and title based on event type
  let color = 0x5865F2; // Default blurple
  let title = 'ER:LC Event';
  let description = '';
  
  switch (eventType) {
    case 'player_join':
      color = 0x00FF00; // Green
      title = '🎮 Player Joined';
      description = `**${data.player || 'Unknown'}** has joined the ER:LC server.`;
      break;
    case 'player_leave':
      color = 0xFF0000; // Red
      title = '👋 Player Left';
      description = `**${data.player || 'Unknown'}** has left the ER:LC server.`;
      break;
    case 'chat':
      color = 0x3498DB; // Blue
      title = '💬 ER:LC Chat';
      description = `**${data.player || 'Unknown'}:** ${data.message || ''}`;
      break;
    case 'WebhookProbe':
      // Don't forward probe events to Discord
      return null;
    default:
      color = 0xFFA500; // Orange
      title = `🎮 ER:LC ${eventType}`;
      description = `Event: ${eventType}\nData: ${JSON.stringify(data, null, 2)}`;
  }
  
  if (!description) return null;
  
  return {
    title,
    description,
    color,
    timestamp: timestamp.toISOString(),
    footer: {
      text: 'ER:LC Server'
    },
    fields: [
      {
        name: 'Time',
        value: `<t:${Math.floor(timestamp.getTime() / 1000)}:F>`,
        inline: true
      }
    ]
  };
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

  // Test endpoint for manual Discord forwarding
  if (url.pathname === '/test-discord' && req.method === 'GET') {
    const testPayload = {
      server: 'test',
      events: [{
        event: 'player_join',
        timestamp: Math.floor(Date.now() / 1000),
        origin: 'test',
        data: { player: 'TestPlayer' }
      }]
    };
    
    forwardToDiscord(testPayload).then(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Test event sent to Discord' }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    });
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
      const isValid = verifyWebhookSignature(rawBody, headers);

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

      // Forward to Discord webhook (don't wait for it)
      forwardToDiscord(payload).catch(err => console.error('Discord forwarding error:', err));

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
