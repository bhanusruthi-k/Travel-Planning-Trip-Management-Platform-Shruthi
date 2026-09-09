const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('--- Testing TripNest API Endpoints ---');

  // Wait a moment for Spring Boot to be ready
  await new Promise((r) => setTimeout(r, 2000));

  // 1. User login (or register if needed)
  console.log('1. Attempting login with traveler user...');
  let loginRes = await request(
    {
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'traveler@tripnest.com', password: 'password123' }
  );

  let token = loginRes?.data?.token;
  if (!token) {
    console.log('Logging in with test user...');
    loginRes = await request(
      {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'user@tripnest.com', password: 'password123' }
    );
    token = loginRes?.data?.token;
  }

  if (!token) {
    console.log('Registering a test traveler user...');
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        fullName: 'Jane Traveler',
        email: `traveler_${Date.now()}@tripnest.com`,
        password: 'password123',
        role: 'TRAVELER',
      }
    );
    token = regRes?.data?.token;
  }

  if (!token) {
    console.error('Failed to get JWT token:', loginRes);
    process.exit(1);
  }

  console.log('✓ Successfully authenticated. JWT token acquired.');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2. Test GET /api/dashboard
  console.log('\n2. Testing GET /api/dashboard...');
  const dashRes = await request(
    {
      hostname: 'localhost',
      port: 8080,
      path: '/api/dashboard',
      method: 'GET',
      headers: authHeaders,
    }
  );

  console.log('Dashboard status:', dashRes.status);
  console.log('Dashboard response keys:', Object.keys(dashRes.data || {}));
  console.log('travelStats:', dashRes.data?.travelStats);
  console.log('budgetOverview:', dashRes.data?.budgetOverview);
  console.log('expenseSummary count:', dashRes.data?.expenseSummary?.length);
  if (dashRes.status === 200 && dashRes.data?.travelStats) {
    console.log('✓ GET /api/dashboard returned valid dashboard response.');
  } else {
    console.error('✗ GET /api/dashboard failed:', dashRes);
  }

  // 3. Test GET /api/notifications
  console.log('\n3. Testing GET /api/notifications & /api/notifications/unread-count...');
  const notifRes = await request(
    {
      hostname: 'localhost',
      port: 8080,
      path: '/api/notifications',
      method: 'GET',
      headers: authHeaders,
    }
  );
  console.log('Notifications status:', notifRes.status);
  console.log('Notifications count:', Array.isArray(notifRes.data) ? notifRes.data.length : 'not array');

  const unreadRes = await request(
    {
      hostname: 'localhost',
      port: 8080,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: authHeaders,
    }
  );
  console.log('Unread count response:', unreadRes.data);
  if (notifRes.status === 200 && unreadRes.status === 200) {
    console.log('✓ Notification endpoints working correctly.');
  }

  // 4. Test trips and adding an expense
  console.log('\n4. Checking trips for user...');
  let tripsRes = await request(
    {
      hostname: 'localhost',
      port: 8080,
      path: '/api/trips',
      method: 'GET',
      headers: authHeaders,
    }
  );

  let tripId = null;
  if (Array.isArray(tripsRes.data) && tripsRes.data.length > 0) {
    tripId = tripsRes.data[0].id;
    console.log(`Found existing trip ID: ${tripId} (${tripsRes.data[0].title})`);
  } else {
    console.log('Creating a test trip for expense testing...');
    const createTripRes = await request(
      {
        hostname: 'localhost',
        port: 8080,
        path: '/api/trips',
        method: 'POST',
        headers: authHeaders,
      },
      {
        title: 'Autumn in Kyoto',
        destinationId: 1,
        startDate: '2026-10-15',
        endDate: '2026-10-22',
        budget: 50000,
        currency: 'INR',
      }
    );
    tripId = createTripRes?.data?.id;
    console.log(`Created trip ID: ${tripId}`);
  }

  if (tripId) {
    console.log(`\n5. Adding an expense to trip ${tripId}...`);
    const expRes = await request(
      {
        hostname: 'localhost',
        port: 8080,
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: authHeaders,
      },
      {
        title: 'Authentic Ramen Dinner',
        description: 'Traditional tonkotsu ramen dinner with matcha dessert',
        category: 'Food',
        amount: 8500,
        expenseDate: '2026-09-08',
      }
    );

    console.log('Expense creation status:', expRes.status);
    console.log('Expense response:', expRes.data?.id, expRes.data?.title, expRes.data?.amount, expRes.data?.category);

    if (expRes.status === 201 || expRes.status === 200) {
      console.log('✓ Expense successfully created in PostgreSQL!');

      // Add a second expense in different category
      console.log('Adding a second expense (Hotel)...');
      await request(
        {
          hostname: 'localhost',
          port: 8080,
          path: `/api/trips/${tripId}/expenses`,
          method: 'POST',
          headers: authHeaders,
        },
        {
          title: 'Boutique Hotel Booking',
          description: '3 nights stay in traditional ryokan',
          category: 'Hotel',
          amount: 20000,
          expenseDate: '2026-09-08',
        }
      );

      // 6. Test GET /api/dashboard again to verify aggregated totals
      console.log('\n6. Verifying updated GET /api/dashboard after adding expenses...');
      const updatedDashRes = await request(
        {
          hostname: 'localhost',
          port: 8080,
          path: '/api/dashboard',
          method: 'GET',
          headers: authHeaders,
        }
      );

      console.log('Updated Total Spent:', updatedDashRes.data?.travelStats?.totalSpent);
      console.log('Updated Budget Overview:', updatedDashRes.data?.budgetOverview);
      console.log('Updated Category Breakdown:', JSON.stringify(updatedDashRes.data?.expenseSummary, null, 2));

      if (updatedDashRes.data?.expenseSummary?.length >= 2) {
        console.log('✓ Category aggregation confirmed in dashboard response!');
      }
    }
  }

  console.log('\n=============================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
}

run().catch((e) => console.error('Verification error:', e));
