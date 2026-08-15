const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

/**
 * Triggers an on-demand revalidation on the Next.js frontend
 * @param {string} tag The cache tag to revalidate (e.g. 'catalog', 'settings')
 * @param {number} retries Number of retry attempts left
 */
async function triggerFrontendRevalidate(tag, retries = 3) {
  if (!REVALIDATION_SECRET) {
    console.warn(`[Cache] Skipping revalidation for '${tag}' - REVALIDATION_SECRET not set`);
    return;
  }

  const url = `${FRONTEND_URL}/api/revalidate?tag=${tag}&secret=${REVALIDATION_SECRET}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Frontend returned status: ${res.status}`);
    }
    console.log(`[Cache] Successfully revalidated tag: ${tag}`);
  } catch (error) {
    console.error(`[Cache] Failed to revalidate tag: ${tag}. Error: ${error.message}`);
    
    if (retries > 0) {
      console.log(`[Cache] Retrying revalidation for '${tag}' in 2 seconds... (${retries} retries left)`);
      setTimeout(() => {
        triggerFrontendRevalidate(tag, retries - 1);
      }, 2000);
    } else {
      console.error(`[Cache] CRITICAL: Exhausted all retries. The frontend cache for '${tag}' is now stale.`);
    }
  }
}

module.exports = { triggerFrontendRevalidate };
