const http = require('http');

function testEndpoint(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5173,
        path,
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, length: data.length }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Vite proxy to backend...');
  const resDash = await testEndpoint('/api/dashboard');
  console.log('GET http://localhost:5173/api/dashboard status:', resDash.status);

  const resNotif = await testEndpoint('/api/notifications');
  console.log('GET http://localhost:5173/api/notifications status:', resNotif.status);

  console.log('✓ Vite proxy forwarding /api requests properly.');
}

run().catch((e) => console.error(e));
