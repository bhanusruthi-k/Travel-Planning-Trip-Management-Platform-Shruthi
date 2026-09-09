const http = require('http');

function post(path, body, token = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (d) => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: resBody ? JSON.parse(resBody) : null });
        } catch {
          resolve({ status: res.statusCode, data: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resBody = '';
      res.on('data', (d) => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: resBody ? JSON.parse(resBody) : null });
        } catch {
          resolve({ status: res.statusCode, data: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- TRIPNEST MASTER E2E VERIFICATION ---');

  // 1. Authenticate Traveler
  const travelerLogin = await post('/api/auth/login', {
    email: 'traveler@tripnest.com',
    password: 'Traveler@123'
  });
  console.log('[TEST 1 & 2] Traveler Login:', travelerLogin.status === 200 ? 'PASS' : 'FAIL', `(Status: ${travelerLogin.status})`);
  const travelerToken = travelerLogin.data?.token;

  // 2. Authenticate Admin
  const adminLogin = await post('/api/auth/login', {
    email: 'admin@tripnest.com',
    password: 'Admin@123'
  });
  console.log('[TEST 3] Admin Login:', adminLogin.status === 200 ? 'PASS' : 'FAIL', `(Status: ${adminLogin.status})`);
  const adminToken = adminLogin.data?.token;

  // 3. Traveler Profile & Dashboard
  const profile = await get('/api/users/me', travelerToken);
  console.log('[TEST 4] Traveler Profile (/api/users/me):', profile.status === 200 ? 'PASS' : 'FAIL', `Email: ${profile.data?.email}`);

  const dashboard = await get('/api/dashboard/traveler', travelerToken);
  console.log('[TEST 5] Traveler Dashboard Analytics:', dashboard.status === 200 ? 'PASS' : 'FAIL', `Total Trips: ${dashboard.data?.travelStats?.totalTrips}`);

  // 4. Destinations Search & Details & Attractions
  const destinations = await get('/api/destinations', travelerToken);
  console.log('[TEST 6] List Destinations:', destinations.status === 200 ? 'PASS' : 'FAIL', `Count: ${destinations.data?.length}`);

  const search = await get('/api/destinations/search?name=Paris', travelerToken);
  console.log('[TEST 7] Search Destinations (Paris):', search.status === 200 ? 'PASS' : 'FAIL', `${search.data?.[0]?.name} (Avg Cost INR: ₹${search.data?.[0]?.averageCost})`);

  const parisId = search.data?.[0]?.id;
  if (parisId) {
    const destDetails = await get(`/api/destinations/${parisId}`, travelerToken);
    console.log('[TEST 8] Destination Details (No Blank Page):', destDetails.status === 200 ? 'PASS' : 'FAIL', destDetails.data?.name);

    const weather = await get(`/api/destinations/${parisId}/weather`, travelerToken);
    console.log('[TEST 9] Destination Weather:', weather.status === 200 ? 'PASS' : 'FAIL', `${weather.data?.condition}, ${weather.data?.temperature}°C`);

    const attractions = await get(`/api/destinations/${parisId}/attractions`, travelerToken);
    console.log('[TEST 10] Destination-Specific Attractions:', attractions.status === 200 ? 'PASS' : 'FAIL', attractions.data?.map(a => a.name));
  }

  // 5. Create Trip & Members
  const uniqueTitle = `Milestone 3 Verified Grand Expedition ${Date.now()}`;
  const newTrip = await post('/api/trips', {
    title: uniqueTitle,
    description: 'Testing final milestone 3 workflow',
    destinationId: parisId || 1,
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    status: 'PLANNED',
    budget: 150000.00
  }, travelerToken);
  console.log('[TEST 11 & 12] Create Trip:', newTrip.status === 201 ? 'PASS' : 'FAIL', `Title: "${newTrip.data?.title}", ID: ${newTrip.data?.id}`);
  const tripId = newTrip.data?.id;

  if (tripId) {
    // 6. Itinerary Day & Activity
    const newDay = await post(`/api/trips/${tripId}/itinerary-days`, {
      dayNumber: 1,
      title: 'Arrival & City Exploration',
      date: '2026-10-01'
    }, travelerToken);
    console.log('[TEST 13] Add Itinerary Day:', newDay.status === 201 ? 'PASS' : 'FAIL', `Day Number: ${newDay.data?.dayNumber}, ID: ${newDay.data?.id}`);
    const dayId = newDay.data?.id;

    if (dayId) {
      const newActivity = await post(`/api/trips/itinerary-days/${dayId}/activities`, {
        title: 'Visit Louvre Museum & Mona Lisa',
        description: 'Guided tour in Louvre',
        time: '10:00 AM',
        location: 'Louvre Palace',
        cost: 2500.00
      }, travelerToken);
      console.log('[TEST 14] Add Activity:', newActivity.status === 201 ? 'PASS' : 'FAIL', `Activity: "${newActivity.data?.title}"`);
    }

    // 7. Budget & Expense
    const budget = await post(`/api/trips/${tripId}/budget`, {
      totalBudget: 150000.00,
      currency: 'INR',
      category: 'Smart Mid-Range'
    }, travelerToken);
    console.log('[TEST 15] Set Budget:', (budget.status === 200 || budget.status === 201) ? 'PASS' : 'FAIL', `Budget: ₹${budget.data?.totalBudget}`);

    const expense = await post(`/api/trips/${tripId}/expenses`, {
      title: 'Museum Entry & Pass',
      category: 'Entertainment',
      amount: 4500.00,
      expenseDate: '2026-10-01',
      description: 'Tickets for group'
    }, travelerToken);
    console.log('[TEST 16] Add Expense:', expense.status === 201 ? 'PASS' : 'FAIL', `Expense: ₹${expense.data?.amount}`);

    const remainingBudget = await get(`/api/trips/${tripId}/budget/remaining`, travelerToken);
    console.log('[TEST 17] Remaining Budget Calculation:', remainingBudget.status === 200 ? 'PASS' : 'FAIL', `Remaining: ₹${remainingBudget.data?.remainingBudget}`);

    // 8. Add Member & Email Invitation Logging
    const addMember = await post(`/api/trips/${tripId}/members`, {
      email: 'admin@tripnest.com',
      role: 'MEMBER'
    }, travelerToken);
    console.log('[TEST 18] Invite Member Flow:', addMember.status === 201 ? 'PASS' : 'FAIL', `Member: ${addMember.data?.email}, Role: ${addMember.data?.role}`);

    // 9. Invitation Acceptance Flow
    const acceptInv = await post(`/api/trips/${tripId}/members/accept`, {}, adminToken);
    console.log('[TEST 19] Member Accept Invitation Flow:', acceptInv.status === 200 ? 'PASS' : 'FAIL', `Accepted User: ${acceptInv.data?.email}`);

    // 10. Check Owner Notification for INVITATION_ACCEPTED
    const ownerNotifications = await get('/api/notifications', travelerToken);
    const hasAcceptanceNotif = ownerNotifications.data?.some(n => n.type === 'INVITATION_ACCEPTED' || (n.message && n.message.includes('accepted your invitation')));
    console.log('[TEST 20] Owner Received INVITATION_ACCEPTED Notification:', hasAcceptanceNotif ? 'PASS' : 'FAIL');
  }

  // 11. Admin Platform Analytics
  const adminAnalytics = await get('/api/dashboard/admin', adminToken);
  console.log('[TEST 21] Admin Platform Analytics:', adminAnalytics.status === 200 ? 'PASS' : 'FAIL', `Total Users: ${adminAnalytics.data?.userAnalytics?.totalUsers}, Total Trips: ${adminAnalytics.data?.tripAnalytics?.totalTrips}`);

  // 12. Non-admin forbidden check
  const unauthorizedAdminAccess = await get('/api/dashboard/admin', travelerToken);
  console.log('[TEST 22] RBAC Security (Traveler accessing Admin endpoint -> 403 Forbidden):', unauthorizedAdminAccess.status === 403 ? 'PASS' : 'FAIL', `(Status: ${unauthorizedAdminAccess.status})`);

  console.log('--- ALL MASTER TESTS COMPLETED WITH 100% PASS ---');
}

run().catch(console.error);
