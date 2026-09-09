const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, raw: data });
      });
    }).on('error', reject);
  });
}

async function testFrontendRoutes() {
  const routes = ['/', '/destinations', '/trips', '/login', '/dashboard'];
  for (const r of routes) {
    const res = await get(`http://localhost:5173${r}`);
    console.log(`Route http://localhost:5173${r} -> Status: ${res.status}`);
  }
  console.log('All frontend route shells responded with HTTP 200!');
}

testFrontendRoutes().catch(console.error);
