
async function main() {
  const loginUrl = 'https://backend-tutorcrm.vercel.app/api/auth/login';
  const parentsUrl = 'https://backend-tutorcrm.vercel.app/api/admin/parents';

  console.log('Logging in to live backend...');
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'thalladachakri@gmail.com',
      password: '12345678',
      role: 'admin'
    })
  });

  if (!loginRes.ok) {
    const text = await loginRes.text();
    console.error(`Login failed with status ${loginRes.status}: ${text}`);
    return;
  }

  const loginData: any = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful. Token acquired.');

  console.log('Fetching live /api/admin/parents...');
  const parentsRes = await fetch(parentsUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log(`Response status: ${parentsRes.status}`);
  const responseText = await parentsRes.text();
  try {
    const data = JSON.parse(responseText);
    console.log(`Response contains ${Array.isArray(data) ? data.length : 'non-array'} elements.`);
    if (Array.isArray(data)) {
      console.log('Sample parent data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Error/Response data:', data);
    }
  } catch (err) {
    console.log('Response is not valid JSON. First 500 characters of response:');
    console.log(responseText.slice(0, 500));
  }
}

main().catch(console.error);
