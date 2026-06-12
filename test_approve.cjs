async function testApprove() {
  try {
    // 1. Login as Admin
    console.log('Logging in as admin...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@edumanage.com',
        password: 'admin123',
        role: 'admin'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }
    const token = loginData.token;
    console.log('Login successful. Token acquired.');

    // 2. Register a student for testing Decline
    console.log('Registering a student for Decline test...');
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Decline',
        email: 'test.decline@gmail.com',
        phone: '1234567890',
        password: 'student123',
        role: 'student',
        grade: '10th Grade',
        learningGoal: 'Calculus BC',
        parentPhone: '9876543210'
      })
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      console.error('Registration failed:', registerData);
      return;
    }
    const studentId = registerData.user.id;
    console.log('Registered student. ID:', studentId);

    // 3. Decline the student
    console.log('Declining student...');
    const declineRes = await fetch(`http://localhost:5000/api/admin/students/${studentId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'decline' })
    });
    const declineData = await declineRes.json();
    console.log('Decline response status:', declineRes.status);
    console.log('Decline response data:', declineData);

  } catch (err) {
    console.error('Error during test:', err);
  }
}

testApprove();
