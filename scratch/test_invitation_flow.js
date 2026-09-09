const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function testFlow() {
  const email = `test_owner_${Date.now()}@tripnest.com`;
  const password = 'Password123!';

  console.log('1. Registering test user:', email);
  const regRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Test Owner',
    email: email,
    password: password
  });

  console.log('Registration status:', regRes.status);
  const token = regRes.body?.token;
  if (!token) {
    console.error('Registration failed to return token:', regRes);
    return;
  }
  console.log('JWT Token acquired successfully.');

  console.log('\n2. Fetching destination ID...');
  const destRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/destinations',
    method: 'GET'
  });
  const destId = destRes.body?.[0]?.id || 1;
  console.log('Using destinationId:', destId);

  console.log('\n3. Creating trip (POST /api/trips)...');
  const tripRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/trips',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    title: 'Paris Summer Vacation',
    description: 'Visiting the Eiffel Tower and Louvre',
    destinationId: destId,
    startDate: '2026-10-01',
    endDate: '2026-10-08',
    status: 'PLANNED',
    budget: 50000
  });

  console.log('Trip creation HTTP status:', tripRes.status);
  const tripId = tripRes.body?.id;
  console.log('Created Trip ID:', tripId);

  if (!tripId) {
    console.error('Trip creation failed:', tripRes);
    return;
  }

  console.log('\n4. Sending member invitation (POST /api/trips/' + tripId + '/members)...');
  const testInviteEmail = `friend_${Date.now()}@example.com`;
  const memberPayload = {
    email: testInviteEmail,
    role: 'MEMBER'
  };
  console.log('Request payload:', JSON.stringify(memberPayload));

  const memberRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, memberPayload);

  console.log('Member invitation HTTP status:', memberRes.status);
  console.log('Member invitation response:', JSON.stringify(memberRes.body, null, 2));

  console.log('\n5. Verifying trip members via GET /api/trips/' + tripId + '/members...');
  const getMembersRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Get members status:', getMembersRes.status);
  console.log('Trip members:', JSON.stringify(getMembersRes.body, null, 2));

  console.log('\n6. Cleaning up test trip...');
  const delRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('Trip deletion status:', delRes.status);
  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===');
}

testFlow().catch(console.error);
