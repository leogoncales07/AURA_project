// Using native fetch available in Node v18+

const API_URL = process.env.API_URL || 'http://localhost:8000';
const t = process.env.T;
const p = process.env.P || 'pass123';

if (!t) {
    console.error('Error: T environment variable is not set.');
    process.exit(1);
}

async function createTestUser() {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Owner-Secret': t,
        },
        body: JSON.stringify({
            email: 'user@example.com',
            password: p,
            name: 'Utilizador Teste'
        })
    });

    const data = await response.json();
    console.log(data);
}

createTestUser();
