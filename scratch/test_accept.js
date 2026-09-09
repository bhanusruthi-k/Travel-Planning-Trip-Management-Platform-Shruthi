const http = require('http');

async function test() {
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@tripnest.com',
    password: 'Admin@123'
  });
  console.log('Admin login:', adminLogin.status, adminLogin.data?.email);

  const res = await post('/api/trips/29/members/accept', {}, adminLogin.data?.token);
  console.log('Accept status:', res.status, JSON.stringify(res.data));
}

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (d) => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: resBody ? JSON.parse(resBody) : null });
        } catch {
          resolve({ status: res.statusCode, data: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

test().catch(console.error);
