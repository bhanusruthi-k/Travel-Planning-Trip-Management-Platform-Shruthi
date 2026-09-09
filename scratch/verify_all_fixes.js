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

async function run() {
  console.log('--- Testing TripNest Email Invitation, Calendar, and UI Backend API ---');

  const ts = Date.now();
  const ownerEmail = `tripowner_${ts}@test.com`;
  const friendEmail = `friend_${ts}@test.com`;

  // 1. Register Owner
  const regOwner = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Trip Owner',
    email: ownerEmail,
    password: 'Password123!',
    role: 'TRAVELER'
  });
  console.log('1. Register Owner Status:', regOwner.status, regOwner.data?.email || regOwner.data);

  // 2. Register Friend
  const regFriend = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Friend Traveler',
    email: friendEmail,
    password: 'Password123!',
    role: 'TRAVELER'
  });
  console.log('2. Register Friend Status:', regFriend.status, regFriend.data?.email || regFriend.data);

  // 3. Login Owner
  const loginOwner = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: ownerEmail,
    password: 'Password123!'
  });
  const token = loginOwner.data?.token;
  console.log('3. Owner Login Status:', loginOwner.status, 'Token acquired:', !!token);

  // 4. Create Trip with invited members
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
    title: 'Goa Friends Adventure',
    description: 'A fun beach trip with friends',
    destinationId: 1,
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    budget: 35000,
    invitedEmails: [friendEmail]
  });
  console.log('4. Create Trip with Invited Member Status:', tripRes.status, 'Trip ID:', tripRes.data?.id);

  // 5. Check Trip Members
  const tripId = tripRes.data?.id;
  const membersRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log('5. Trip Members count:', membersRes.data?.length, membersRes.data?.map(m => m.user?.email || m.email));

  // 6. Test direct invite member API
  const newMemberEmail = `colleague_${ts}@test.com`;
  await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    fullName: 'Colleague User',
    email: newMemberEmail,
    password: 'Password123!',
    role: 'TRAVELER'
  });

  const addMemberRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: `/api/trips/${tripId}/members`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    email: newMemberEmail,
    role: 'MEMBER'
  });
  console.log('6. Add Member via API Status:', addMemberRes.status, 'Result:', addMemberRes.data?.user?.email || addMemberRes.data);

  // 7. Test Profile Date of Birth Update
  const profileRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/users/me',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    fullName: 'Trip Owner Updated',
    dateOfBirth: '2006-03-04',
    city: 'Bangalore',
    country: 'India',
    gender: 'MALE'
  });
  console.log('7. Profile Update DOB Status:', profileRes.status, 'DOB saved:', profileRes.data?.dateOfBirth);

  console.log('--- API Verification Complete ---');
}

run().catch(console.error);
