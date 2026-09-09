const http = require('http');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testMultipleTrips() {
  const loginRes = await post('http://localhost:8080/api/auth/login', {
    email: 'traveler@tripnest.com',
    password: 'Traveler@123'
  });
  const token = loginRes.data?.token;

  const tripsRes = await get('http://localhost:8080/api/trips', token);
  const trips = tripsRes.data || [];
  console.log(`Testing ${trips.length} trips...`);

  for (const t of trips.slice(0, 4)) {
    const res = await get(`http://localhost:8080/api/trips/${t.id}`, token);
    console.log(`Trip ID ${t.id} -> Status: ${res.status}, Title: "${res.data?.title}", Destination: "${res.data?.destination?.name}", Dates: ${res.data?.startDate} to ${res.data?.endDate}`);
  }
}

testMultipleTrips().catch(console.error);
