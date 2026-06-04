const axios = require('axios');

async function testSignup() {
  try {
    const response = await axios.post('http://localhost:5000/api/patients/auth/signup', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '9999999999'
    });
    
  } catch (error) {
    if (error.response) {
      
    } else {
      
    }
  }
}

testSignup();
