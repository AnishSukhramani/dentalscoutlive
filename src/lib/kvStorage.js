// Vercel KV using REST API to avoid build-time import issues
let kv;

// Initialize KV storage
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  // Use REST API directly to avoid import issues
  kv = createKVFromRestAPI();
  console.log('Using Vercel KV REST API');
} else {
  // Use fallback storage for development
  console.log('Using fallback storage');
  kv = createFallbackKV();
}

function createKVFromRestAPI() {
  const baseUrl = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  return {
    get: async (key) => {
      try {
        const response = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          return data === 'null' ? null : JSON.parse(data);
        }
        return null;
      } catch (error) {
        console.error('KV GET error:', error);
        return null;
      }
    },
    
    set: async (key, value) => {
      try {
        const response = await fetch(`${baseUrl}/set/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(value)
        });
        
        return response.ok ? 'OK' : 'ERROR';
      } catch (error) {
        console.error('KV SET error:', error);
        return 'ERROR';
      }
    },
    
    del: async (key) => {
      try {
        const response = await fetch(`${baseUrl}/del/${encodeURIComponent(key)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        return response.ok ? 1 : 0;
      } catch (error) {
        console.error('KV DEL error:', error);
        return 0;
      }
    }
  };
}

function createFallbackKV() {
  return {
    get: async (key) => {
      console.log(`KV GET (fallback): ${key}`);
      return null;
    },
    set: async (key, value) => {
      console.log(`KV SET (fallback): ${key}`);
      return 'OK';
    },
    del: async (key) => {
      console.log(`KV DEL (fallback): ${key}`);
      return 1;
    }
  };
}

/**
 * KV Storage Utility Functions
 * Replaces file-based storage with Vercel KV for serverless compatibility
 */

// Default data structures for each storage type
const DEFAULT_DATA = {
  emailQueue: { queue: [] },
  emailTemplates: { templates: [] },
  users: { users: [] },
  tags: { tags: [] },
  emailCounters: { counters: [] },
  processingStats: {
    totalProcessed: 0,
    totalFailed: 0,
    lastProcessingTime: null,
    sessionProcessed: 0,
    sessionFailed: 0
  },
  scheduledEmails: { emails: [] },
  failedEmails: { emails: [] }
};

/**
 * Generic function to get data from KV storage
 * @param {string} key - The storage key
 * @param {object} defaultValue - Default value if key doesn't exist
 * @returns {Promise<object>} - The stored data
 */
export async function getKVData(key, defaultValue = null) {
  try {
    const data = await kv.get(key);
    if (data === null) {
      return defaultValue || DEFAULT_DATA[key] || {};
    }
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error(`Error getting data from KV for key ${key}:`, error);
    return defaultValue || DEFAULT_DATA[key] || {};
  }
}

/**
 * Generic function to set data in KV storage
 * @param {string} key - The storage key
 * @param {object} data - The data to store
 * @returns {Promise<boolean>} - Success status
 */
export async function setKVData(key, data) {
  try {
    await kv.set(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error setting data in KV for key ${key}:`, error);
    return false;
  }
}

/**
 * Email Queue Operations
 */
export async function getEmailQueue() {
  return await getKVData('emailQueue');
}

export async function setEmailQueue(data) {
  return await setKVData('emailQueue', data);
}

/**
 * Email Templates Operations
 */
export async function getEmailTemplates() {
  return await getKVData('emailTemplates');
}

export async function setEmailTemplates(data) {
  return await setKVData('emailTemplates', data);
}

/**
 * Users Operations
 */
export async function getUsers() {
  return await getKVData('users');
}

export async function setUsers(data) {
  return await setKVData('users', data);
}

/**
 * Tags Operations
 */
export async function getTags() {
  return await getKVData('tags');
}

export async function setTags(data) {
  return await setKVData('tags', data);
}

/**
 * Email Counters Operations
 */
export async function getEmailCounters() {
  return await getKVData('emailCounters');
}

export async function setEmailCounters(data) {
  return await setKVData('emailCounters', data);
}

/**
 * Processing Stats Operations
 */
export async function getProcessingStats() {
  return await getKVData('processingStats');
}

export async function setProcessingStats(data) {
  return await setKVData('processingStats', data);
}

/**
 * Scheduled Emails Operations
 */
export async function getScheduledEmails() {
  return await getKVData('scheduledEmails');
}

export async function setScheduledEmails(data) {
  return await setKVData('scheduledEmails', data);
}

/**
 * Failed Emails Operations
 */
export async function getFailedEmails() {
  return await getKVData('failedEmails');
}

export async function setFailedEmails(data) {
  return await setKVData('failedEmails', data);
}

/**
 * Migration function to move data from files to KV
 * This should be run once to migrate existing data
 */
export async function migrateDataFromFiles() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const dataFiles = [
      'emailQueue.json',
      'templates.json', 
      'user.json',
      'tags.json',
      'emailCounters.json',
      'processingStats.json',
      'scheduledEmails.json',
      'failedEmails.json'
    ];
    
    for (const file of dataFiles) {
      try {
        const filePath = path.join(process.cwd(), 'data', file);
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const key = file.replace('.json', '');
          await setKVData(key, fileData);
          console.log(`Migrated ${file} to KV storage`);
        }
      } catch (error) {
        console.error(`Error migrating ${file}:`, error);
      }
    }
    
    console.log('Data migration completed');
    return true;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
}
