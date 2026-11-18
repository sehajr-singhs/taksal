const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const directory = path.join(__dirname, 'site');

function serve(req, res) {
  let filePath = path.join(directory, req.url === '/' ? 'index.html' : req.url.substring(1));
  
  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.png': contentType = 'image/png'; break;
  }
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Page not found', { 'Content-Type': 'text/html' });
      } else {
        res.writeHead(500);
        res.end(err.code + ': ' + err.message, { 'Content-Type': 'text/plain' });
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

http.createServer(serve).listen(port, () => {
  console.log(`Server running at port ${port}`);
});