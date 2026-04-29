require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

(async () => {
  const result = await sendEmail({
    to: 'sunilkumar.sk.sk143@gmail.com', 
    subject: 'Test Email - Resend Migration', 
    html: 'This is a test email to verify Resend works after migration.'
  });
  console.log('Result:', result);
})();
