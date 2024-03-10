const express = require('express');
const http = require('http');
const https = require('https');
const app = express();

// Allow CORS in your proxy server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Proxy endpoint
app.all('/proxy', (req, res) => {
  const url = req.query.url; // Get the URL from the query parameters

  if (!url) {
    return res.status(400).send('URL parameter is missing');
  }

  const targetURL = new URL(url);
  const options = {
    hostname: targetURL.hostname,
    port: targetURL.port || (targetURL.protocol === 'https:' ? 443 : 80),
    path: targetURL.pathname + targetURL.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'game.aq.com', // Set the 'Host' header to game.aq.com
      'Access-Control-Allow-Origin': '*', // Add cross-origin headers
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
	  
    },
  };

  const protocol = options.port === 443 ? https : http;

  // Proxy the request
  const proxyReq = protocol.request(options, (proxyRes) => {
    // Forward the received headers to the client
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe the proxy response to the client
    proxyRes.pipe(res, {
      end: true,
    });
  });

  // Pipe the client request to the proxy request
  req.pipe(proxyReq, {
    end: true,
  });

  // Additional error handling
  proxyReq.on('error', (err) => {
    console.error('Proxy Request Error:', err);
    res.status(500).send('Proxy Request Error');
  });
});

// Start the server
const port = 5588;
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});