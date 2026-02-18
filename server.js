const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
const COUNTER_FILE = path.join(__dirname, 'visitors.json');
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
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

let visitorCount = (function () {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).count || 0;
  } catch {
    return 0;
  }
})();

function writeCounter(count) {
  fs.writeFile(COUNTER_FILE, JSON.stringify({ count }), () => {});
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

http.createServer((req, res) => {
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

    res.writeHead(200, headers);
    return res.end(JSON.stringify({ count: visitorCount }));
  }

  if (pathname === '/') pathname = '/index.html';

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

    res.writeHead(200, Object.assign({
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    }, SECURITY_HEADERS));
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});
