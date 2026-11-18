const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

const port = 3334;
const directory = path.join(__dirname, 'site', 'pages');

function serveFile(res, filePath, contentType) {
  // Try the file path first, then fall back to site/pages
  let attempts = [filePath, path.join('site', 'pages', path.basename(filePath))];
  
  let index = 0;
  function attemptRead() {
    if (index >= attempts.length) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    fs.readFile(attempts[index], (err, content) => {
      if (err) {
        index++;
        attemptRead();
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  }
  attemptRead();
}

const server = http.createServer((req, res) => {
  let filePath = path.join(directory, parse(req.url).pathname.substring(1) || 'index.html');
  
  // Security: prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(path.normalize(directory))) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.png': contentType = 'image/png'; break;
    case '.html': contentType = 'text/html'; break;
  }
  
  serveFile(res, normalizedPath, contentType);
});

server.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});