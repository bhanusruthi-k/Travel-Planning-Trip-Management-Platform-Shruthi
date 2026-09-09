const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('--- Step 1: Wait for Backend Health ---');
  let healthy = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await get('http://localhost:8080/api/health');
      if (res.status === 200 && res.data && res.data.status === 'UP') {
        console.log('Backend is UP & HEALTHY! Response:', res.data);
        healthy = true;
        break;
      }
    } catch (e) {
      // waiting
    }
    await sleep(1000);
  }

  if (!healthy) {
    console.error('Backend failed to become healthy in 30s');
    process.exit(1);
  }

  console.log('\n--- Step 2: Direct Backend Destination Endpoints ---');
  const allDest = await get('http://localhost:8080/api/destinations');
  console.log(`GET /api/destinations -> Status: ${allDest.status}, Total count: ${allDest.data?.length}`);

  const popular = await get('http://localhost:8080/api/destinations/popular');
  console.log(`GET /api/destinations/popular -> Status: ${popular.status}, Count: ${popular.data?.length}`);

  const search = await get('http://localhost:8080/api/destinations/search?name=Paris');
  console.log(`GET /api/destinations/search?name=Paris -> Status: ${search.status}, Results: ${search.data?.map(d => d.name).join(', ')}`);

  if (allDest.data && allDest.data.length > 0) {
    const firstId = allDest.data[0].id;
    const single = await get(`http://localhost:8080/api/destinations/${firstId}`);
    console.log(`GET /api/destinations/${firstId} -> Status: ${single.status}, Name: ${single.data?.name}`);

    const attractions = await get(`http://localhost:8080/api/destinations/${firstId}/attractions`);
    console.log(`GET /api/destinations/${firstId}/attractions -> Status: ${attractions.status}, Count: ${attractions.data?.length}`);

    const weather = await get(`http://localhost:8080/api/destinations/${firstId}/weather`);
    console.log(`GET /api/destinations/${firstId}/weather -> Status: ${weather.status}, Temp: ${weather.data?.temperature}°C`);
  }

  console.log('\n--- Step 3: Frontend Vite Proxy Test ---');
  let proxySuccess = false;
  for (let i = 0; i < 15; i++) {
    try {
      const proxyRes = await get('http://localhost:5173/api/destinations');
      if (proxyRes.status === 200 && Array.isArray(proxyRes.data)) {
        console.log(`GET http://localhost:5173/api/destinations (Vite Proxy) -> Status: ${proxyRes.status}, Total count: ${proxyRes.data.length}`);
        proxySuccess = true;
        break;
      }
    } catch (e) {
      // wait for vite
    }
    await sleep(1000);
  }

  if (proxySuccess) {
    console.log('\n>>> ALL CONNECTIVITY & STARTUP VERIFICATIONS PASSED SUCCESSFULLY! <<<');
  } else {
    console.error('\nVite proxy verification failed.');
    process.exit(1);
  }
}

run().catch(console.error);
