// Authentication middleware - decode JWT and extract userId
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }
    
    // Decode JWT token to extract userId
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return res.status(401).json({ error: 'Invalid token format' })
    }
    
    try {
      // Decode payload (part 1)
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      
      if (!decoded.userId) {
        console.error('[Auth] No userId in token payload:', decoded)
        return res.status(401).json({ error: 'Invalid token - missing userId' })
      }
      
      // Extract and store userId from token
      req.userId = decoded.userId
      console.log('[Auth] ✓ Authenticated user:', req.userId)
      next()
    } catch (decodeError) {
      console.error('[Auth] Failed to decode token:', decodeError.message)
      return res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    console.error('[Auth] Error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}
