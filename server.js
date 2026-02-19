const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 8081;
const COUNTER_FILE = path.join(__dirname, 'visitors.json');
const GUESTBOOK_FILE = path.join(__dirname, 'guestbook.json');
const PROJECT_ROOT = path.resolve(__dirname) + path.sep;

// Allowed directories and files for static serving
const ALLOWED_DIRS = ['/js/', '/css/', '/assets/'];
const ALLOWED_FILES = ['/index.html', '/robots.txt', '/sitemap.xml'];

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', // Legacy fallback; CSP frame-ancestors 'none' is the modern equivalent
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // HSTS: effective only behind TLS-terminating proxy (Cloudflare Tunnel)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://github-contributions-api.jogruber.de; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Compressible MIME types
const COMPRESSIBLE = new Set([
  'text/html', 'text/css', 'application/javascript',
  'application/json', 'image/svg+xml', 'application/xml', 'text/plain',
]);

let visitorCount = (function () {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).count || 0;
  } catch {
    return 0;
  }
})();

// ─── Guestbook ────────────────────────────────────────────
let guestbookEntries = (function () {
  try {
    return JSON.parse(fs.readFileSync(GUESTBOOK_FILE, 'utf8')).entries || [];
  } catch {
    return [];
  }
})();

function writeGuestbook(entries) {
  const tmp = GUESTBOOK_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify({ entries }), (err) => {
    if (err) return console.error('Guestbook write failed:', err);
    fs.rename(tmp, GUESTBOOK_FILE, (err) => {
      if (err) console.error('Guestbook rename failed:', err);
    });
  });
}

function sanitizeText(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

var MAX_GUESTBOOK_ENTRIES = 500;

function getClientIP(req) {
  // CF-Connecting-IP is set by Cloudflare and cannot be spoofed by the client
  var cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) return cfIP.trim();
  // Fallback for direct connections (development)
  return req.socket.remoteAddress || '';
}

// ─── Rate Limiter ─────────────────────────────────────────
const rateLimitMap = new Map();

function isRateLimited(ip) {
  var now = Date.now();
  var entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

// Cleanup expired entries every 5 minutes
setInterval(function () {
  var now = Date.now();
  for (var [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 300000);

function writeCounter(count) {
  const tmp = COUNTER_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify({ count }), (err) => {
    if (err) return console.error('Counter write failed:', err);
    fs.rename(tmp, COUNTER_FILE, (err) => {
      if (err) console.error('Counter rename failed:', err);
    });
  });
}

function parseCookies(req) {
  var cookies = {};
  (req.headers.cookie || '').split(';').forEach(function (c) {
    var idx = c.indexOf('=');
    if (idx > 0) {
      cookies[c.substring(0, idx).trim()] = c.substring(idx + 1).trim();
    }
  });
  return cookies;
}

const server = http.createServer((req, res) => {
  // Request size limit
  if (req.url.length > 2048) {
    res.writeHead(414, SECURITY_HEADERS);
    return res.end('URI Too Long');
  }

  const parsed = new URL(req.url, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400, SECURITY_HEADERS);
    return res.end('Bad Request');
  }

  // Visitor counter API
  if (pathname === '/api/visitors') {
    var cookies = parseCookies(req);
    var headers = Object.assign({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    }, SECURITY_HEADERS);

    if (!cookies.visited) {
      visitorCount++;
      writeCounter(visitorCount);
      headers['Set-Cookie'] = 'visited=1; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly; Secure';
    }

    // No gzip on API responses (BREACH mitigation)
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ count: visitorCount }));
  }

  // ─── Guestbook API ───────────────────────────────────────
  if (pathname === '/api/guestbook') {
    var ip = getClientIP(req);
    var apiHeaders = Object.assign({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    }, SECURITY_HEADERS);

    if (req.method === 'GET') {
      // Return entries without IP addresses, newest first, max 50
      var publicEntries = guestbookEntries
        .slice()
        .reverse()
        .slice(0, 50)
        .map(function (e) { return { name: e.name, message: e.message, date: e.date }; });
      res.writeHead(200, apiHeaders);
      return res.end(JSON.stringify({ entries: publicEntries }));
    }

    if (req.method === 'POST') {
      if (isRateLimited(ip)) {
        res.writeHead(429, apiHeaders);
        return res.end(JSON.stringify({ error: 'Too many requests, slow down' }));
      }

      var body = '';
      var aborted = false;
      req.on('data', function (chunk) {
        body += chunk;
        if (body.length > 1024) {
          aborted = true;
          res.writeHead(413, apiHeaders);
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });
      req.on('end', function () {
        if (aborted) return;

        var data;
        try {
          data = JSON.parse(body);
        } catch {
          res.writeHead(400, apiHeaders);
          return res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }

        // Validate message
        var message = typeof data.message === 'string' ? sanitizeText(data.message) : '';
        if (!message || message.length < 1) {
          res.writeHead(400, apiHeaders);
          return res.end(JSON.stringify({ error: 'Message is required' }));
        }
        if (message.length > 100) {
          res.writeHead(400, apiHeaders);
          return res.end(JSON.stringify({ error: 'Message too long (max 100 chars)' }));
        }

        // Validate name
        var name = typeof data.name === 'string' ? sanitizeText(data.name) : '';
        if (!name) name = 'Anonymous';
        if (name.length > 20) name = name.substring(0, 20);

        // IP duplicate check
        var alreadySigned = guestbookEntries.some(function (e) { return e.ip === ip; });
        if (alreadySigned) {
          res.writeHead(409, apiHeaders);
          return res.end(JSON.stringify({ error: 'You already signed the guestbook!' }));
        }

        // Entry cap
        if (guestbookEntries.length >= MAX_GUESTBOOK_ENTRIES) {
          res.writeHead(409, apiHeaders);
          return res.end(JSON.stringify({ error: 'Guestbook is full' }));
        }

        var entry = {
          name: name,
          message: message,
          date: new Date().toISOString().split('T')[0],
          ip: ip,
        };
        guestbookEntries.push(entry);
        writeGuestbook(guestbookEntries);

        res.writeHead(201, apiHeaders);
        return res.end(JSON.stringify({
          success: true,
          entry: { name: entry.name, message: entry.message, date: entry.date },
        }));
      });
      return;
    }

    res.writeHead(405, apiHeaders);
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (pathname === '/') pathname = '/index.html';

  // Normalize to collapse path segments like /../ before allowlist check
  pathname = path.posix.normalize(pathname);

  // Allowlist check: only serve files from allowed dirs/paths
  const isAllowed = ALLOWED_FILES.includes(pathname) ||
                    ALLOWED_DIRS.some(function (dir) { return pathname.startsWith(dir); });
  if (!isAllowed) {
    res.writeHead(404, SECURITY_HEADERS);
    return res.end('Not Found');
  }

  // Path traversal protection
  const filePath = path.resolve(path.join(__dirname, pathname));
  if (!filePath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403, SECURITY_HEADERS);
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'text/plain' }, SECURITY_HEADERS));
      return res.end('Not Found');
    }

    const contentType = MIME[ext] || 'application/octet-stream';

    // Smart caching: long cache for assets (images, fonts), short for code/html
    var cacheControl = 'no-cache';
    if (pathname.startsWith('/assets/')) {
      cacheControl = 'public, max-age=2592000, immutable'; // 30 days
    } else if (ext === '.css' || ext === '.js') {
      cacheControl = 'public, max-age=3600'; // 1 hour
    }

    var headers = Object.assign({
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    }, SECURITY_HEADERS);

    // Gzip compression for static files only (not API — avoids BREACH-style timing)
    var acceptEncoding = req.headers['accept-encoding'] || '';
    if (COMPRESSIBLE.has(contentType) && acceptEncoding.includes('gzip')) {
      zlib.gzip(data, function (err, compressed) {
        if (err) {
          res.writeHead(200, headers);
          return res.end(data);
        }
        headers['Content-Encoding'] = 'gzip';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        res.end(compressed);
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
});

server.timeout = 30000;
server.keepAliveTimeout = 15000;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});

