const fs = require('fs');
const key = 'YOUR_API_KEY_HERE';

async function testApi(model, version) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
  let output = `Testing ${model} on ${version}...\n`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
    });
    output += `Status: ${res.status}\n`;
    const data = await res.text();
    output += `Response: ${data}\n\n`;
  } catch (e) {
    output += `Error: ${e.message}\n\n`;
  }
  return output;
}

async function run() {
  let finalOut = '';
  finalOut += await testApi('gemini-2.0-flash', 'v1');
  finalOut += await testApi('gemini-2.5-flash', 'v1');
  finalOut += await testApi('gemini-1.5-flash', 'v1beta');
  fs.writeFileSync('test_out2.txt', finalOut, 'utf8');
}

run();
