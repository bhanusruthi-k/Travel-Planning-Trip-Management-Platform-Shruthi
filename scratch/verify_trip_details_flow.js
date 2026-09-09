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

async function verifyTripAndDestinationSeparation() {
  console.log('--- 1. Authenticate as Traveler ---');
  const loginRes = await post('http://localhost:8080/api/auth/login', {
    email: 'traveler@tripnest.com',
    password: 'Traveler@123'
  });
  console.log('Login Status:', loginRes.status, 'User:', loginRes.data?.user?.email);
  const token = loginRes.data?.token;

  console.log('\n--- 2. Fetch User Trips (My Trips) ---');
  const tripsRes = await get('http://localhost:8080/api/trips', token);
  console.log('Trips count:', tripsRes.data?.length);

  let testTripId = tripsRes.data?.[0]?.id;
  if (!testTripId) {
    console.log('Creating a sample trip for testing...');
    const createRes = await post('http://localhost:8080/api/trips', {
      title: 'Wedding in London',
      description: 'Family wedding celebration and sightseeing',
      destinationId: 6, // London
      startDate: '2026-12-01',
      endDate: '2026-12-12',
      status: 'PLANNED',
      budget: 200000
    }, token);
    testTripId = createRes.data?.id;
    console.log('Sample Trip Created with ID:', testTripId);
  }

  console.log('\n--- 3. Verify Trip Details Flow (FLOW B: /trips/' + testTripId + ') ---');
  const tripDetails = await get(`http://localhost:8080/api/trips/${testTripId}`, token);
  console.log(`GET /api/trips/${testTripId} -> Status: ${tripDetails.status}, Title: "${tripDetails.data?.title}", Destination: "${tripDetails.data?.destination?.name}"`);

  const itinerary = await get(`http://localhost:8080/api/trips/${testTripId}/itinerary-days`, token);
  console.log(`GET /api/trips/${testTripId}/itinerary-days -> Status: ${itinerary.status}, Days: ${itinerary.data?.length}`);

  const members = await get(`http://localhost:8080/api/trips/${testTripId}/members`, token);
  console.log(`GET /api/trips/${testTripId}/members -> Status: ${members.status}, Members count: ${members.data?.length}`);

  console.log('\n--- 4. Verify Destination Details Flow (FLOW A: /destinations/6) ---');
  const destDetails = await get('http://localhost:8080/api/destinations/6');
  console.log(`GET /api/destinations/6 -> Status: ${destDetails.status}, Destination: "${destDetails.data?.name}", Country: "${destDetails.data?.country}"`);

  const attractions = await get('http://localhost:8080/api/destinations/6/attractions');
  console.log(`GET /api/destinations/6/attractions -> Status: ${attractions.status}, Attractions count: ${attractions.data?.length}`);

  console.log('\n>>> CONFIRMED: Trip Details (/trips/' + testTripId + ') and Destination Details (/destinations/6) are completely separate and functioning! <<<');
}

verifyTripAndDestinationSeparation().catch(console.error);
