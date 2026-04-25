require('dotenv').config();
const { sendEmail } = require('./services/emailService');

(async () => {
  const result = await sendEmail(
    'test@example.com', 
    'Test Email', 
    'This is a test email to verify Nodemailer works.'
  );
  console.log('Result:', result);
})();
