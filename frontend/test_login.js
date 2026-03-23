fetch('http://127.0.0.1:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Owner-Secret': 'rRA5utI-P45PjhV3HP1gYLmDCSbFL29l-uqunqqtArV8mohJk9Ov1R2QSGKYkZXN'
  },
  body: JSON.stringify({ email: 'demo@aura.com', password: 'demo123456' })
}).then(res => res.json().then(j => console.log('STATUS:', res.status, 'BODY:', j))).catch(err => console.error('ERROR:', err));
