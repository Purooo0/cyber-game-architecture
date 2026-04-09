import * as authService from "../services/authService.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Debug: lihat apa yang diterima
    console.log("Register request body:", req.body);
    console.log("Username:", username, "Email:", email, "Password:", password);

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, dan password harus diisi",
        received: { username, email, password } // Debug info
      });
    }

    const result = await authService.registerUser({ username, email, password });

    res.status(201).json({ success: true, user: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ 
        error: "email dan password harus diisi" 
      });
    }
    
    const result = await authService.loginUser({ email, password });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

export async function logout(req, res) {
  try {
    // Logout is stateless - just clear token on client side
    // Server side doesn't need to do anything special for JWT
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}