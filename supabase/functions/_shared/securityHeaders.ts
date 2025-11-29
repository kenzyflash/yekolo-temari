// Shared security headers for all edge functions

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Combined headers for responses
export const getResponseHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => ({
  ...corsHeaders,
  ...securityHeaders,
  'Content-Type': 'application/json',
  ...additionalHeaders,
});

// Helper to create secure JSON response
export const secureJsonResponse = (
  body: unknown, 
  status: number = 200, 
  additionalHeaders: Record<string, string> = {}
): Response => {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: getResponseHeaders(additionalHeaders),
    }
  );
};

// Helper for CORS preflight response
export const corsPreflightResponse = (): Response => {
  return new Response(null, {
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    }
  });
};
