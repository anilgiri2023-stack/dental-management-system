require('dotenv').config();
const { sendEmail, sendOTP } = require('./utils/emailService');

(async () => {
  console.log('--- Starting Email Tests ---');
  
  // Test 1: General Email
  console.log('\nTesting General Email...');
  const result1 = await sendEmail({
    to: process.env.SMTP_FROM || 'sunilkumar.sk.sk143@gmail.com', 
    subject: 'Test Email - Brevo SMTP Migration', 
    html: '<h2>Brevo SMTP is working! ✅</h2><p>This is a test email sent using Nodemailer.</p>'
  });
  console.log('General Email Result:', result1.success ? 'SUCCESS ✅' : 'FAILED ❌', result1.error || '');

  // Test 2: OTP Email
  console.log('\nTesting OTP Email...');
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const result2 = await sendOTP(process.env.SMTP_FROM || 'sunilkumar.sk.sk143@gmail.com', testOtp);
  console.log('OTP Email Result:', result2.success ? 'SUCCESS ✅' : 'FAILED ❌', result2.error || '');

  console.log('\n--- Email Tests Completed ---');
})();
