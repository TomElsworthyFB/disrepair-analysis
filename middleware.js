// middleware.js
function validateApiKey(req, res, next) {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Check for API key in headers
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }
  
  try {
    // Parse client information from environment variable
    const clientsData = JSON.parse(process.env.CLIENT_API_KEYS || '{}');
    const clientInfo = clientsData.keys?.[apiKey];
    
    // Validate the key
    if (!clientInfo) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }
    
    // Check if key is active
    if (clientInfo.active === false) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'API key is inactive'
      });
    }
    
    // Add client info to request for use in API handlers
    req.client = clientInfo;
    
    // Continue to the main handler
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Error processing authentication'
    });
  }
}

module.exports = { validateApiKey };