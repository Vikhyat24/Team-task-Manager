const API_URL = 'http://localhost:3000/api';
let token = '';

async function fetchApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

async function runTests() {
  try {
    console.log('1. Testing Signup...');
    const signupData = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
      }),
    });
    token = signupData.token;
    console.log('Signup successful. Token:', token.substring(0, 20) + '...');

    console.log('\n2. Testing Get Current User...');
    const meData = await fetchApi('/auth/me');
    console.log('Get Current User successful:', meData.user.email);

    console.log('\n3. Testing Create Project...');
    const projectData = await fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Test Project',
        description: 'Created by automated test script',
      }),
    });
    const projectId = projectData.data.id;
    console.log('Project created successfully. ID:', projectId);

    console.log('\n4. Testing Create Task...');
    const taskData = await fetchApi(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'E2E Test Task',
        description: 'Should be in TODO state',
        priority: 'HIGH',
      }),
    });
    const taskId = taskData.data.id;
    console.log('Task created successfully. ID:', taskId);

    console.log('\n5. Testing Update Task Status...');
    const updateData = await fetchApi(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'IN_PROGRESS',
      }),
    });
    console.log('Task updated successfully to:', updateData.data.status);

    console.log('\n6. Testing Dashboard...');
    const dashData = await fetchApi('/dashboard');
    console.log('Dashboard fetched successfully.');
    console.log('Stats:', dashData.data.stats);

    console.log('\n✅ ALL TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error(error.message);
  }
}

runTests();
