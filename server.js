import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const PORT = process.env.PORT || 8080;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let filePath = req.url;
    
    // Remove query parameters
    filePath = filePath.split('?')[0];
    
    // Default to index.html for root
    if (filePath === '/') {
      filePath = '/index.html';
    }
    
    // For all routes, try to serve the file, but fallback to index.html for SPA routing
    let fullPath = join(__dirname, 'dist', filePath);
    
    try {
      const content = await readFile(fullPath);
      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      // If file doesn't exist, serve index.html for client-side routing
      if (error.code === 'ENOENT') {
        try {
          const indexContent = await readFile(join(__dirname, 'dist', 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        } catch (indexError) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 