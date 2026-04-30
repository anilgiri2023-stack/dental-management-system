require("dotenv").config(); 
const { sendEmail } = require("./utils/emailService"); 

(async () => { 
  await sendEmail({ 
    to: "anilofficial2005@gmail.com", 
    subject: "Resend Working 🚀", 
    html: "<h2>Email working successfully ✅</h2>", 
  }); 
})(); 
