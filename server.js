const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8081;
const COUNTER_FILE = path.join(__dirname, 'visitors.json');

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

function readCounter() {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).count || 0;
  } catch {
    return 0;
  }
}

function writeCounter(count) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count }));
}

function parseCookies(req) {
  var cookies = {};
  (req.headers.cookie || '').split(';').forEach(function (c) {
    var parts = c.trim().split('=');
    if (parts.length === 2) cookies[parts[0]] = parts[1];
  });
  return cookies;
}

http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname);

  // Visitor counter API
  if (pathname === '/api/visitors') {
    var cookies = parseCookies(req);
    var count = readCounter();
    var headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    };

    if (!cookies.visited) {
      count++;
      writeCounter(count);
      headers['Set-Cookie'] = 'visited=1; Path=/; Max-Age=86400; SameSite=Lax';
    }

    res.writeHead(200, headers);
    return res.end(JSON.stringify({ count }));
  }

  if (pathname === '/') pathname = '/index.html';

  // Block visitors.json from being served
  if (pathname === '/visitors.json') {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (err2, html) => {
        if (err2) {
          res.writeHead(500);
          return res.end('Internal Server Error');
        }
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        });
        res.end(html);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving on http://127.0.0.1:${PORT}`);
});
