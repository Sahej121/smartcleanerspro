import { query, getClient, logSystemEvent } from './db';

// Export everything from db.js
export { query, getClient, logSystemEvent };

// Provide 'client' alias for 'query' for compatibility with some older patterns
export const client = { query };
