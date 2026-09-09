const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runMasterVerification() {
  console.log('===============================================================');
  console.log('TRIPNEST — MASTER END-TO-END SUITE VERIFICATION');
  console.log('===============================================================');

  const ts = Date.now();
  const ownerEmail = `owner_${ts}@tripnest.com`;
  const memberEmail = `member_${ts}@tripnest.com`;
  const strangerEmail = `stranger_${ts}@tripnest.com`;
  const adminEmail = `admin_${ts}@tripnest.com`;
  const password = 'Password123!';

  // Register users
  console.log('\n[Setup] Registering users...');
  const ownerReg = await request({ hostname: 'localhost', port: 8080, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { fullName: 'Trip Owner', email: ownerEmail, password });
  const ownerToken = ownerReg.data.token;
  console.log('✓ Owner registered:', ownerEmail, 'Token:', !!ownerToken);

  const memberReg = await request({ hostname: 'localhost', port: 8080, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { fullName: 'Regular Member', email: memberEmail, password });
  const memberToken = memberReg.data.token;
  const memberUserId = memberReg.data.user.id;
  console.log('✓ Member registered:', memberEmail, 'UserId:', memberUserId);

  const strangerReg = await request({ hostname: 'localhost', port: 8080, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { fullName: 'Stranger Traveler', email: strangerEmail, password });
  const strangerToken = strangerReg.data.token;
  console.log('✓ Stranger registered:', strangerEmail);

  // --------------------------------------------------------------------------
  // TEST 1 — Invitation Email & Trip Creation
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 1: Trip Creation & Member Invitation Flow');
  console.log('---------------------------------------------------------------');
  const createTripRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/trips', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, {
    title: 'Goa Summer Escapade',
    description: 'Beach holiday and water sports',
    destinationId: 1,
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    status: 'PLANNED',
    budget: 50000
  });
  console.log('1. POST /api/trips status:', createTripRes.status, 'Trip ID:', createTripRes.data?.id);
  const tripId = createTripRes.data.id;

  const inviteRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, { email: memberEmail, role: 'MEMBER' });
  console.log('2. POST /api/trips/' + tripId + '/members status:', inviteRes.status, 'Member ID:', inviteRes.data?.id, 'Email Delivered flag:', inviteRes.data?.emailDelivered);

  // --------------------------------------------------------------------------
  // TEST 2 — Destination Discovery & Search
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 2: Destination Discovery, Search, Weather, Attractions');
  console.log('---------------------------------------------------------------');
  const allDestRes = await request({ hostname: 'localhost', port: 8080, path: '/api/destinations', method: 'GET' });
  console.log('1. GET /api/destinations status:', allDestRes.status, 'Count:', allDestRes.data?.length);

  const searchDestRes = await request({ hostname: 'localhost', port: 8080, path: '/api/destinations/search?name=Goa', method: 'GET' });
  console.log('2. GET /api/destinations/search?name=Goa status:', searchDestRes.status, 'Matches:', searchDestRes.data?.map(d => d.name));

  const popularDestRes = await request({ hostname: 'localhost', port: 8080, path: '/api/destinations/popular', method: 'GET' });
  console.log('3. GET /api/destinations/popular status:', popularDestRes.status, 'Count:', popularDestRes.data?.length);

  const singleDestRes = await request({ hostname: 'localhost', port: 8080, path: `/api/destinations/${allDestRes.data[0].id}`, method: 'GET' });
  console.log('4. GET /api/destinations/' + allDestRes.data[0].id + ' status:', singleDestRes.status, 'Name:', singleDestRes.data?.name);

  const weatherRes = await request({ hostname: 'localhost', port: 8080, path: `/api/destinations/${allDestRes.data[0].id}/weather`, method: 'GET' });
  console.log('5. GET /api/destinations/' + allDestRes.data[0].id + '/weather status:', weatherRes.status, 'Temperature:', weatherRes.data?.temperature, 'Condition:', weatherRes.data?.condition);

  const attractionsRes = await request({ hostname: 'localhost', port: 8080, path: `/api/destinations/${allDestRes.data[0].id}/attractions`, method: 'GET' });
  console.log('6. GET /api/destinations/' + allDestRes.data[0].id + '/attractions status:', attractionsRes.status, 'Count:', attractionsRes.data?.length);

  // --------------------------------------------------------------------------
  // TEST 3, 4, 5 — Budget & Expenses & 80% / 100% Alerts
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 3, 4, 5: Budget Creation, Expenses, 80% and 100% Alerts');
  console.log('---------------------------------------------------------------');
  const createBudgetRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/budget`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, {
    totalBudget: 50000,
    currency: 'INR',
    category: 'Standard',
    accommodationBudget: 25000,
    foodBudget: 15000,
    transportationBudget: 5000,
    activitiesBudget: 5000,
    emergencyBudget: 0
  });
  console.log('1. POST /api/trips/' + tripId + '/budget status:', createBudgetRes.status, 'Total Budget:', createBudgetRes.data?.totalBudget, 'Currency:', createBudgetRes.data?.currency);

  // Add initial expense ₹10,000 (20%)
  const exp1Res = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/expenses`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, {
    title: 'Hotel Booking Advance',
    amount: 10000,
    category: 'Hotel',
    expenseDate: '2026-11-02'
  });
  console.log('2. POST expense ₹10,000 status:', exp1Res.status);

  // Check budget summary
  const summary1 = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/expenses/summary`, method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('3. Budget Summary after ₹10,000:', {
    totalBudget: summary1.data?.totalBudget,
    totalExpenses: summary1.data?.totalExpenses,
    remainingBudget: summary1.data?.remainingBudget,
    percentageUsed: summary1.data?.percentageUsed + '%'
  });

  // Add expense to cross 80% (Add ₹32,000 -> Total ₹42,000 = 84%)
  const exp2Res = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/expenses`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, {
    title: 'Flight Tickets & Resorts',
    amount: 32000,
    category: 'Transportation',
    expenseDate: '2026-11-03'
  });
  console.log('4. POST expense ₹32,000 (reaching 84%) status:', exp2Res.status);

  // Add expense to cross 100% (Add ₹10,000 -> Total ₹52,000 = 104%)
  const exp3Res = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/expenses`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, {
    title: 'Scuba Diving & Fine Dining',
    amount: 10000,
    category: 'Entertainment',
    expenseDate: '2026-11-04'
  });
  console.log('5. POST expense ₹10,000 (reaching 104%) status:', exp3Res.status);

  const summaryFinal = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/expenses/summary`, method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('6. Final Budget Summary:', {
    totalBudget: summaryFinal.data?.totalBudget,
    totalExpenses: summaryFinal.data?.totalExpenses,
    remainingBudget: summaryFinal.data?.remainingBudget,
    percentageUsed: summaryFinal.data?.percentageUsed + '%',
    isOverBudget: summaryFinal.data?.isOverBudget
  });

  // --------------------------------------------------------------------------
  // TEST 6 — Members & RBAC Security
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 6: Member RBAC Permission Enforcement');
  console.log('---------------------------------------------------------------');
  // Member views members -> Should be 200 OK
  const memberGetRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members`, method: 'GET',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  console.log('1. Member GET /api/trips/' + tripId + '/members status:', memberGetRes.status, 'Count:', memberGetRes.data?.length);

  // Regular Member tries to invite someone -> Should be 403 Forbidden
  const memberInviteRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
  }, { email: 'another@example.com', role: 'MEMBER' });
  console.log('2. Regular Member invite attempt status:', memberInviteRes.status, memberInviteRes.status === 403 ? '✓ (403 Forbidden Enforced)' : '✗ FAILED');

  // Regular Member tries to remove owner -> Should be 403 Forbidden
  const memberRemoveRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members/1`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  console.log('3. Regular Member remove attempt status:', memberRemoveRes.status, memberRemoveRes.status === 403 ? '✓ (403 Forbidden Enforced)' : '✗ FAILED');

  // Owner promotes Member to GROUP_ADMIN -> Should be 200 OK
  const updateRoleRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members/${memberUserId}/role`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ownerToken}` }
  }, { role: 'GROUP_ADMIN' });
  console.log('4. Owner updates Member to GROUP_ADMIN status:', updateRoleRes.status, 'New Role:', updateRoleRes.data?.role);

  // Now promoted GROUP_ADMIN can invite a new traveler -> Should be 201 Created
  const groupAdminInviteRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/members`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
  }, { email: `invited_by_admin_${ts}@example.com`, role: 'MEMBER' });
  console.log('5. Promoted GROUP_ADMIN invite attempt status:', groupAdminInviteRes.status, 'Member ID:', groupAdminInviteRes.data?.id);

  // --------------------------------------------------------------------------
  // TEST 7 — Search Trips & Join Request Flow
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 7: Trip Search & Join Request Workflow');
  console.log('---------------------------------------------------------------');
  const searchTripRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/trips/search?name=Goa', method: 'GET',
    headers: { 'Authorization': `Bearer ${strangerToken}` }
  });
  console.log('1. GET /api/trips/search?name=Goa status:', searchTripRes.status, 'Found trips:', searchTripRes.data?.map(t => t.title));

  const joinReqRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/join-requests`, method: 'POST',
    headers: { 'Authorization': `Bearer ${strangerToken}` }
  });
  console.log('2. Stranger POST join-request status:', joinReqRes.status, 'Request ID:', joinReqRes.data?.id, 'Status:', joinReqRes.data?.status);
  const requestId = joinReqRes.data?.id;

  const approveRes = await request({
    hostname: 'localhost', port: 8080, path: `/api/trips/${tripId}/join-requests/${requestId}/approve`, method: 'PUT',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('3. Owner approves join-request status:', approveRes.status, 'Status:', approveRes.data?.status);

  // --------------------------------------------------------------------------
  // TEST 8 — Notifications
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 8: Notifications System');
  console.log('---------------------------------------------------------------');
  const notifsRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('1. Owner notifications count:', notifsRes.data?.length);
  if (notifsRes.data?.length > 0) {
    console.log('   Recent notification:', notifsRes.data[0]?.message, 'Type:', notifsRes.data[0]?.type);
  }

  const unreadCountRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/notifications/unread-count', method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('2. Owner unread notification count:', unreadCountRes.data?.unreadCount);

  if (notifsRes.data?.length > 0) {
    const markReadRes = await request({
      hostname: 'localhost', port: 8080, path: `/api/notifications/${notifsRes.data[0].id}/read`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    console.log('3. Mark as read status:', markReadRes.status, 'Is Read:', markReadRes.data?.read);
  }

  // --------------------------------------------------------------------------
  // TEST 10 — Traveler & Admin Dashboard Analytics
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 10: Traveler & Admin Dashboard Analytics');
  console.log('---------------------------------------------------------------');
  const dashRes = await request({
    hostname: 'localhost', port: 8080, path: '/api/dashboard', method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('1. Traveler Dashboard status:', dashRes.status, {
    totalTrips: dashRes.data?.totalTrips,
    upcomingTrips: dashRes.data?.upcomingTrips,
    totalBudget: dashRes.data?.totalBudget,
    totalSpent: dashRes.data?.totalSpent,
    categoriesCount: dashRes.data?.expenseBreakdown?.length
  });

  // Regular traveler tries to access Admin dashboard -> 403 Forbidden
  const adminDashForbidden = await request({
    hostname: 'localhost', port: 8080, path: '/api/dashboard/admin', method: 'GET',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  console.log('2. Regular user GET /api/dashboard/admin status:', adminDashForbidden.status, adminDashForbidden.status === 403 ? '✓ (403 Forbidden Enforced)' : '✗ FAILED');

  console.log('\n===============================================================');
  console.log('ALL MASTER SUITE VERIFICATION CHECKS COMPLETED!');
  console.log('===============================================================');
}

runMasterVerification().catch(console.error);
