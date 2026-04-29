const API = import.meta.env.VITE_API_URL; 

console.log("API URL:", API); 

export async function sendOtp(email) { 
  const res = await fetch(`${API}/api/auth/send-otp`, { 
    method: "POST", 
    headers: { 
      "Content-Type": "application/json" 
    }, 
    body: JSON.stringify({ email }) 
  }); 
  return res.json(); 
} 

export async function verifyOtp(email, otp) { 
  const res = await fetch(`${API}/api/auth/verify-otp`, { 
    method: "POST", 
    headers: { 
      "Content-Type": "application/json" 
    }, 
    body: JSON.stringify({ email, otp }) 
  }); 
  return res.json(); 
} 
