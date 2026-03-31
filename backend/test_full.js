const fs = require('fs');
const key = 'YOUR_API_KEY_HERE';

async function testFull() {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`;
  const payload = {
    contents: [{
      parts: [{
        text: 'hello'
      }]
    }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
  };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const status = res.status;
  const data = await res.text();
  console.log('Status:', status);
  console.log('Response:', data);
}

testFull();
