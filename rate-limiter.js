// rate-limiter.js
// In-memory rate limiter for Vercel serverless functions

// Storage objects for rate limiting (shared across invocations in same instance)
const ipLimits = {};
const apiKeyLimits = {};

/**
 * Rate limiting middleware
 * Limits API requests based on API key or IP address
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function rateLimit(req, res, next) {
  // Get current timestamp
  const now = Date.now();
  
  // Get client identifier (API key or IP)
  const apiKey = req.headers['x-api-key'];
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             '0.0.0.0';
             
  // Frontend requests are identified by the x-futurbyte-frontend header
  const isFrontendRequest = req.headers['x-futurbyte-frontend'] === 'true';
  
  // Use API key as identifier if available, otherwise use IP
  const identifier = apiKey || `ip:${ip}`;
  const storage = apiKey ? apiKeyLimits : ipLimits;
  
  // Configure rate limits based on request type
  // Production rate limits as stated in the API documentation
  let maxRequests;
  let timeWindow;
  
  if (isFrontendRequest) {
    // Frontend requests: 60 requests per hour
    maxRequests = 60;
    timeWindow = 60 * 60 * 1000; // 1 hour in milliseconds
    console.log('Frontend request - using frontend rate limits');
  } else {
    // API key requests: 30 requests per hour per API key
    maxRequests = 30;
    timeWindow = 60 * 60 * 1000; // 1 hour in milliseconds
    console.log('API request - using API key rate limits');
  }
  
  // Log status before processing
  console.log(`Rate limit check for ${identifier}`);
  console.log(`Current limits: ${storage[identifier]?.count || 0}/${maxRequests} requests`);
  
  // Initialize or update entry
  if (!storage[identifier]) {
    storage[identifier] = {
      count: 1,
      timestamp: now
    };
    console.log(`First request from ${identifier}`);
  } else if (now - storage[identifier].timestamp > timeWindow) {
    // Reset if window expired
    storage[identifier] = {
      count: 1,
      timestamp: now
    };
    console.log(`Window expired for ${identifier}, reset count to 1`);
  } else {
    // Increment count within window
    storage[identifier].count++;
    console.log(`Incremented count for ${identifier} to ${storage[identifier].count}`);
    
    // Check if over limit
    if (storage[identifier].count > maxRequests) {
      console.log(`Rate limit exceeded for ${identifier}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow / (60 * 1000)} minutes.`,
        resetAt: new Date(storage[identifier].timestamp + timeWindow).toISOString()
      });
    }
  }
  
  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - storage[identifier].count));
  res.setHeader('X-RateLimit-Reset', new Date(storage[identifier].timestamp + timeWindow).toISOString());
  
  // Continue to next middleware
  console.log('Rate limit check passed');
  next();
}

module.exports = { rateLimit };