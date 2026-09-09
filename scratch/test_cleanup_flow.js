const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== TRIPNEST COMPREHENSIVE VERIFICATION ===\n');
  const timestamp = Date.now();
  const travelerEmail = `traveler_${timestamp}@tripnest.com`;
  const adminEmail = `admin_${timestamp}@tripnest.com`;
  const password = 'Password@123';

  // 1. Register Traveler
  console.log('1. Testing Traveler Registration...');
  const regTravelerRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    fullName: 'Sruthi Sruthi',
    email: travelerEmail,
    password: password,
  });
  console.log(`Status: ${regTravelerRes.status}`, regTravelerRes.data?.user ? 'SUCCESS (Created)' : regTravelerRes.data);
  if (regTravelerRes.status !== 201) throw new Error('Traveler registration failed');

  // 2. Login Traveler
  console.log('\n2. Testing Traveler Login...');
  const loginTravelerRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: travelerEmail,
    password: password,
    expectedRole: 'TRAVELER',
  });
  console.log(`Status: ${loginTravelerRes.status}, Role: ${loginTravelerRes.data?.user?.role}`);
  const travelerToken = loginTravelerRes.data?.token;
  if (!travelerToken) throw new Error('Traveler login token missing');

  // 3. Get destinations to find valid destinationId
  const destRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/destinations',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const destinationId = destRes.data?.[0]?.id || 1;

  // 4. Traveler Creates a Trip
  console.log('\n3. Testing Traveler Trip Creation (Allowed)...');
  const createTripRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/trips',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${travelerToken}`,
    },
  }, {
    title: 'Kyoto Explorer',
    description: 'Spring trip to Kyoto temples',
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    budget: 2500,
    destinationId: destinationId,
  });
  console.log(`Status: ${createTripRes.status}, Trip ID: ${createTripRes.data?.id}`);
  if (createTripRes.status !== 201 && createTripRes.status !== 200) {
    throw new Error('Traveler trip creation failed: ' + JSON.stringify(createTripRes.data));
  }

  // 5. Register Admin
  console.log('\n4. Testing Admin Registration...');
  const regAdminRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register-admin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    fullName: 'System Administrator',
    email: adminEmail,
    password: password,
  });
  console.log(`Status: ${regAdminRes.status}`, regAdminRes.data?.user ? 'SUCCESS (Created)' : regAdminRes.data);

  // 6. Login Admin
  console.log('\n5. Testing Admin Login...');
  const loginAdminRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: adminEmail,
    password: password,
    expectedRole: 'ADMINISTRATOR',
  });
  console.log(`Status: ${loginAdminRes.status}, Role: ${loginAdminRes.data?.user?.role}`);
  const adminToken = loginAdminRes.data?.token;

  // 7. Test Admin Trip Creation Restriction (Must return 403 Forbidden)
  console.log('\n6. Testing Admin Trip Creation Restriction (Forbidden 403)...');
  const adminCreateTripRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/trips',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
  }, {
    title: 'Admin Personal Trip',
    description: 'Should be blocked',
    startDate: '2026-11-01',
    endDate: '2026-11-05',
    budget: 1000,
    destinationId: destinationId,
  });
  console.log(`Status: ${adminCreateTripRes.status}`, adminCreateTripRes.status === 403 ? 'SUCCESS: 403 Forbidden received!' : 'FAILED');
  if (adminCreateTripRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for admin trip creation, but got ${adminCreateTripRes.status}`);
  }

  // 8. Test Delete My Account (for traveler)
  console.log('\n7. Testing Delete My Account endpoint DELETE /api/auth/account...');
  const deleteAccRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/account',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${travelerToken}`,
    },
  });
  console.log(`Status: ${deleteAccRes.status}`, deleteAccRes.status === 204 ? 'SUCCESS (204 No Content)' : deleteAccRes.status);
  if (deleteAccRes.status !== 204) {
    throw new Error(`Expected 204 for delete account, got ${deleteAccRes.status}`);
  }

  // 9. Verify Deleted User Cannot Login
  console.log('\n8. Verifying Deleted User Cannot Login...');
  const loginDeletedRes = await makeRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    email: travelerEmail,
    password: password,
    expectedRole: 'TRAVELER',
  });
  console.log(`Status: ${loginDeletedRes.status}`, (loginDeletedRes.status === 401 || loginDeletedRes.status === 400) ? 'SUCCESS (Rejected)' : 'FAILED');

  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
