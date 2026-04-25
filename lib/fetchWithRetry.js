export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  // Ensure Idempotency Key
  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Idempotency-Key')) {
    headers.set('X-Idempotency-Key', crypto.randomUUID());
  }

  const fetchOptions = { ...options, headers };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);
      if (res.ok) return res;
      
      // If client error (4xx) other than 429, or if we shouldn't retry, throw
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
         throw new Error(`Client Error: ${res.status}`);
      }
      
      // Otherwise it's 5xx or 429, we can retry
      if (attempt === retries) throw new Error(`Server Error: ${res.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
    }
    // Wait before retrying (exponential backoff)
    await new Promise(r => setTimeout(r, backoff * Math.pow(2, attempt - 1)));
  }
}
