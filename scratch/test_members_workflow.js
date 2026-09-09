const BASE_URL = 'http://localhost:8080';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runTests() {
  console.log('--- Testing TripNest Members & People Flow ---');

  // 1. Authenticate Owner
  const ownerEmail = 'sruthi@example.com';
  const ownerPassword = 'password123';
  let ownerToken;

  try {
    const loginData = await req(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
    });
    ownerToken = loginData.token || loginData.jwt;
    console.log('✓ Owner login successful:', ownerEmail);
  } catch (err) {
    console.log('Registering owner...');
    await req(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Sruthi Travel Planner',
        email: ownerEmail,
        password: ownerPassword,
        role: 'USER',
      }),
    });
    const loginData = await req(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
    });
    ownerToken = loginData.token || loginData.jwt;
    console.log('✓ Owner registered and logged in:', ownerEmail);
  }

  // 2. Register/Ensure Rahul and Priya exist
  const rahulEmail = 'rahul@example.com';
  const priyaEmail = 'priya@example.com';
  const friendEmail = 'friend@example.com';

  for (const [name, email] of [
    ['Rahul Sharma', rahulEmail],
    ['Priya Patel', priyaEmail],
    ['Friend Explorer', friendEmail],
  ]) {
    try {
      await req(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: name,
          email: email,
          password: 'password123',
          role: 'USER',
        }),
      });
      console.log(`✓ Created user: ${name} (${email})`);
    } catch (e) {
      console.log(`✓ User exists/ready: ${name} (${email})`);
    }
  }

  // Fetch destination ID
  const destinations = await req(`${BASE_URL}/api/destinations`);
  const destId = destinations[0].id;
  console.log(`✓ Using destination ID: ${destId} (${destinations[0].name})`);

  // TEST 1: CREATE TRIP WITHOUT MEMBERS
  console.log('\n--- TEST 1: Create Trip without Members (Solo Trip) ---');
  const soloTrip = await req(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Solo Goa Trip',
      description: 'Solo getaway for relaxation',
      destinationId: destId,
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      budget: 15000,
      status: 'PLANNED',
      invitedEmails: [],
    }),
  });
  console.log('✓ Solo trip created with ID:', soloTrip.id);

  const soloMembers = await req(`${BASE_URL}/api/trips/${soloTrip.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log(`✓ Solo trip members count: ${soloMembers.length}`);
  console.log('  Members:', soloMembers.map((m) => `${m.fullName} (${m.role})`));
  if (soloMembers.length !== 1 || soloMembers[0].role !== 'OWNER') {
    throw new Error('Solo trip members list should contain only the OWNER');
  }

  // TEST 2: CREATE TRIP WITH MEMBERS (Rahul and Priya)
  console.log('\n--- TEST 2: Create Trip with Invited Members ---');
  const groupTrip = await req(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Goa Friends Trip',
      description: 'Friends vacation along the coast',
      destinationId: destId,
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      budget: 50000,
      status: 'PLANNED',
      invitedEmails: [rahulEmail, priyaEmail, ownerEmail], // ownerEmail must be skipped
    }),
  });
  console.log('✓ Group trip created with ID:', groupTrip.id);

  const groupMembers = await req(`${BASE_URL}/api/trips/${groupTrip.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log(`✓ Group trip members count: ${groupMembers.length}`);
  console.log('  Members:', groupMembers.map((m) => `${m.fullName} (${m.role})`));
  if (groupMembers.length !== 3) {
    throw new Error(`Group trip should contain exactly 3 members, got ${groupMembers.length}`);
  }

  // TEST 3: ADD MEMBER AFTER CREATION (Invite friend from Trip Details)
  console.log('\n--- TEST 3: Add Member after Creation via POST /api/trips/{id}/members ---');
  await req(`${BASE_URL}/api/trips/${groupTrip.id}/members`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ email: friendEmail, role: 'MEMBER' }),
  });
  console.log(`✓ Invited ${friendEmail} to trip ${groupTrip.id}`);

  const updatedMembers = await req(`${BASE_URL}/api/trips/${groupTrip.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  console.log(`✓ Total members now: ${updatedMembers.length}`);
  console.log('  Members:', updatedMembers.map((m) => `${m.fullName} (${m.role})`));
  if (updatedMembers.length !== 4) {
    throw new Error(`Total members should now be 4, got ${updatedMembers.length}`);
  }

  // TEST 4: PERMISSIONS & ROLE MANAGEMENT
  console.log('\n--- TEST 4: Role Promotion & Member Permissions ---');
  const rahulMember = updatedMembers.find((m) => m.email === rahulEmail);
  console.log(`Promoting ${rahulMember.fullName} to GROUP_ADMIN...`);
  await req(`${BASE_URL}/api/trips/${groupTrip.id}/members/${rahulMember.userId}/role`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ role: 'GROUP_ADMIN' }),
  });
  const afterPromoMembers = await req(`${BASE_URL}/api/trips/${groupTrip.id}/members`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const promotedRahul = afterPromoMembers.find((m) => m.email === rahulEmail);
  console.log(`✓ Rahul's role is now: ${promotedRahul.role}`);
  if (promotedRahul.role !== 'GROUP_ADMIN') {
    throw new Error('Rahul was not promoted to GROUP_ADMIN');
  }

  // TEST 5: EXPENSE LOGGING WITH PAYER
  console.log('\n--- TEST 5: Expense with Assigned Payer ---');
  const expense = await req(`${BASE_URL}/api/trips/${groupTrip.id}/expenses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Beachside Seafood Dinner',
      category: 'Food',
      amount: 4500,
      expenseDate: '2026-10-13',
      payerId: rahulMember.userId,
    }),
  });
  console.log('✓ Expense created:', expense.title);
  console.log('  Payer Name:', expense.payerName);
  console.log('  Payer Email:', expense.payerEmail);
  if (expense.payerEmail !== rahulEmail) {
    throw new Error('Expense payerEmail does not match Rahul');
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 5 INTEGRATION AND MEMBERSHIP TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err.data || err.message);
  process.exit(1);
});
