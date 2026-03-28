import 'dotenv/config';
import jwt from 'jsonwebtoken';
import prisma from './server/src/db.js';

async function test() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) { console.log('No admin found'); return; }
  
  const token = jwt.sign({ userId: admin.id }, process.env.JWT_SECRET);
  console.log("Got token");
  
  const res = await fetch('http://localhost:5000/api/admin/invites', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'intern99@lms.com', role: 'learner' })
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test();
