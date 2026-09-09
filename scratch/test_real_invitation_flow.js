const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function testFlow() {
  console.log('=== TRIPNEST INVITATION EMAIL FLOW VERIFICATION ===\n');

  const ts = Date.now();
  const ownerEmail = `tripowner_${ts}@test.com`;
  const unregisteredFriendEmail = `friend_unregistered_${ts}@gmail.com`;

  // 1. Register Owner
  console.log('STEP 1: Register trip owner');
  const regRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Arjun Verma',
    email: ownerEmail,
    password: 'Password123!',
    role: 'TRAVELER'
  });
  console.log(' -> Owner registered. HTTP Status:', regRes.status);
  const token = regRes.data?.token;

  // 2. Create a trip
  console.log('\nSTEP 2: Owner creates a trip (e.g. Manali Adventure)');
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
    title: 'Manali Mountains Getaway',
    description: 'Trekking and relaxation in Himachal Pradesh',
    destinationId: 1,
    startDate: '2026-11-05',
    endDate: '2026-11-12',
    budget: 45000
  });
  const tripId = tripRes.data?.id;
  console.log(' -> Trip created. Trip ID:', tripId, 'Title:', tripRes.data?.title);

  // 3. Invite unregistered friend email
  console.log(`\nSTEP 3: Send invitation to unregistered friend email: ${unregisteredFriendEmail}`);
  const inviteRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    email: unregisteredFriendEmail,
    role: 'MEMBER'
  });

  console.log(' -> Invitation Request HTTP Status:', inviteRes.status);
  console.log(' -> Response Body:', JSON.stringify(inviteRes.data, null, 2));

  // 4. Check trip members list
  console.log('\nSTEP 4: Verify members list for trip');
  const membersRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log(' -> Total Members on Trip:', membersRes.data?.length);
  membersRes.data?.forEach((m, idx) => {
    console.log(`   ${idx + 1}. ${m.fullName} (${m.email}) - Role: ${m.role}`);
  });

  console.log('\n=== INVITATION FLOW VERIFICATION COMPLETED ===');
}

testFlow().catch(console.error);
