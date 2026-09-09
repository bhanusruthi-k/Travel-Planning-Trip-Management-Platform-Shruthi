const BASE_URL = 'http://localhost:8080/api/auth';

async function runTests() {
  const timestamp = Date.now();
  console.log('=== TRIPNEST END-TO-END AUTHENTICATION & REGISTRATION TEST ===\n');

  // TEST A: Traveler Registration & Login
  console.log('--- TEST A: Traveler Registration & Login ---');
  const travelerEmail = `traveler_${timestamp}@tripnest.com`;
  const travelerPass = 'Traveler@Pass123';
  const travelerName = 'Bhanu Traveler';

  const regTravelerRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: travelerName, email: travelerEmail, password: travelerPass })
  });

  const regTravelerData = await regTravelerRes.json();
  console.log('Traveler Registration Status:', regTravelerRes.status);
  console.log('Traveler User Object:', regTravelerData.user);
  if (regTravelerRes.status !== 201 || regTravelerData.user?.role !== 'TRAVELER') {
    throw new Error('TEST A Failed: Traveler registration did not return 201 or TRAVELER role');
  }

  // Traveler Login
  const loginTravelerRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: travelerEmail, password: travelerPass, expectedRole: 'TRAVELER' })
  });
  const loginTravelerData = await loginTravelerRes.json();
  console.log('Traveler Login Status:', loginTravelerRes.status);
  console.log('Traveler Token Received:', !!loginTravelerData.token);
  console.log('Traveler Login Role:', loginTravelerData.user?.role);
  if (loginTravelerRes.status !== 200 || loginTravelerData.user?.role !== 'TRAVELER') {
    throw new Error('TEST A Failed: Traveler login failed');
  }
  console.log('>>> TEST A PASSED: Traveler registered and logged in successfully!\n');

  // TEST B: Admin Registration & Login
  console.log('--- TEST B: Admin Registration & Login ---');
  const adminEmail = `admin_${timestamp}@tripnest.com`;
  const adminPass = 'Admin@Pass123';
  const adminName = 'Bhanu Admin';

  const regAdminRes = await fetch(`${BASE_URL}/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: adminName, email: adminEmail, password: adminPass })
  });

  const regAdminData = await regAdminRes.json();
  console.log('Admin Registration Status:', regAdminRes.status);
  console.log('Admin User Object:', regAdminData.user);
  if (regAdminRes.status !== 201 || regAdminData.user?.role !== 'ADMINISTRATOR') {
    throw new Error('TEST B Failed: Admin registration did not return 201 or ADMINISTRATOR role');
  }

  // Admin Login
  const loginAdminRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass, expectedRole: 'ADMINISTRATOR' })
  });
  const loginAdminData = await loginAdminRes.json();
  console.log('Admin Login Status:', loginAdminRes.status);
  console.log('Admin Token Received:', !!loginAdminData.token);
  console.log('Admin Login Role:', loginAdminData.user?.role);
  if (loginAdminRes.status !== 200 || loginAdminData.user?.role !== 'ADMINISTRATOR') {
    throw new Error('TEST B Failed: Admin login failed');
  }
  console.log('>>> TEST B PASSED: Admin registered and logged in successfully!\n');

  // TEST C: Wrong Login Portal Rejections
  console.log('--- TEST C: Wrong Login Portal Rejections ---');
  // Traveler attempting Admin Login
  const wrongAdminRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: travelerEmail, password: travelerPass, expectedRole: 'ADMINISTRATOR' })
  });
  const wrongAdminData = await wrongAdminRes.json();
  console.log('Traveler on Admin Login Status:', wrongAdminRes.status);
  console.log('Rejection Message:', wrongAdminData.message);
  if (wrongAdminRes.status !== 400 || !wrongAdminData.message.includes('Traveler Login')) {
    throw new Error('TEST C Failed: Traveler was not properly rejected on Admin portal');
  }

  // Admin attempting Traveler Login
  const wrongTravelerRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPass, expectedRole: 'TRAVELER' })
  });
  const wrongTravelerData = await wrongTravelerRes.json();
  console.log('Admin on Traveler Login Status:', wrongTravelerRes.status);
  console.log('Rejection Message:', wrongTravelerData.message);
  if (wrongTravelerRes.status !== 400 || !wrongTravelerData.message.includes('Admin Login')) {
    throw new Error('TEST C Failed: Admin was not properly rejected on Traveler portal');
  }
  console.log('>>> TEST C PASSED: Role-specific portals strictly enforce backend validation!\n');

  // TEST D: Duplicate Email Registration Rejection
  console.log('--- TEST D: Duplicate Email Registration ---');
  const dupRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Another Person', email: travelerEmail, password: 'AnotherPassword@123' })
  });
  const dupData = await dupRes.json();
  console.log('Duplicate Registration Status:', dupRes.status);
  console.log('Duplicate Error Message:', dupData.message);
  if (dupRes.status !== 400 || !dupData.message.includes('already exists')) {
    throw new Error('TEST D Failed: Duplicate email was not properly rejected');
  }
  console.log('>>> TEST D PASSED: Duplicate registration rejected with friendly message!\n');

  console.log('========================================================');
  console.log('ALL AUTHENTICATION & REGISTRATION END-TO-END TESTS PASSED!');
  console.log('========================================================');
}

runTests().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
