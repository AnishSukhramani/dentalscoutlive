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
  // Use file-based storage as fallback for development
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(process.cwd(), 'data');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return {
    get: async (key) => {
      try {
        const filePath = path.join(dataDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(data);
        }
        return null;
      } catch (error) {
        console.error(`Error reading ${key}:`, error);
        return null;
      }
    },
    
    set: async (key, value) => {
      try {
        const filePath = path.join(dataDir, `${key}.json`);
        // Don't double-encode JSON since the value is already an object
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
        console.log(`Saved ${key} to file storage`);
        return 'OK';
      } catch (error) {
        console.error(`Error saving ${key}:`, error);
        return 'ERROR';
      }
    },
    
    del: async (key) => {
      try {
        const filePath = path.join(dataDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted ${key} from file storage`);
          return 1;
        }
        return 0;
      } catch (error) {
        console.error(`Error deleting ${key}:`, error);
        return 0;
      }
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
async function getKVData(key, defaultValue = null) {
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
async function setKVData(key, data) {
  try {
    await kv.set(key, data);
    return true;
  } catch (error) {
    console.error(`Error setting data in KV for key ${key}:`, error);
    return false;
  }
}

/**
 * Email Queue Operations
 */
async function getEmailQueue() {
  return await getKVData('emailQueue');
}

async function setEmailQueue(data) {
  return await setKVData('emailQueue', data);
}

/**
 * Email Templates Operations
 */
async function getEmailTemplates() {
  return await getKVData('emailTemplates');
}

async function setEmailTemplates(data) {
  return await setKVData('emailTemplates', data);
}

/**
 * Users Operations
 */
async function getUsers() {
  return await getKVData('users');
}

async function setUsers(data) {
  return await setKVData('users', data);
}

/**
 * Tags Operations
 */
async function getTags() {
  return await getKVData('tags');
}

async function setTags(data) {
  return await setKVData('tags', data);
}

/**
 * Email Counters Operations
 */
async function getEmailCounters() {
  return await getKVData('emailCounters');
}

async function setEmailCounters(data) {
  return await setKVData('emailCounters', data);
}

/**
 * Processing Stats Operations
 */
async function getProcessingStats() {
  return await getKVData('processingStats');
}

async function setProcessingStats(data) {
  return await setKVData('processingStats', data);
}

/**
 * Scheduled Emails Operations
 */
async function getScheduledEmails() {
  return await getKVData('scheduledEmails');
}

async function setScheduledEmails(data) {
  return await setKVData('scheduledEmails', data);
}

/**
 * Failed Emails Operations
 */
async function getFailedEmails() {
  return await getKVData('failedEmails');
}

async function setFailedEmails(data) {
  return await setKVData('failedEmails', data);
}

/**
 * Migration function to move data from old JSON files to new storage
 * This should be run once to migrate existing data
 */
async function migrateDataFromFiles() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const dataFiles = [
      { oldFile: 'emailQueue.json', newKey: 'emailQueue' },
      { oldFile: 'templates.json', newKey: 'emailTemplates' },
      { oldFile: 'user.json', newKey: 'users' },
      { oldFile: 'tags.json', newKey: 'tags' },
      { oldFile: 'emailCounters.json', newKey: 'emailCounters' },
      { oldFile: 'processingStats.json', newKey: 'processingStats' },
      { oldFile: 'scheduledEmails.json', newKey: 'scheduledEmails' },
      { oldFile: 'failedEmails.json', newKey: 'failedEmails' }
    ];
    
    for (const { oldFile, newKey } of dataFiles) {
      try {
        const oldFilePath = path.join(process.cwd(), 'data', oldFile);
        if (fs.existsSync(oldFilePath)) {
          const fileData = JSON.parse(fs.readFileSync(oldFilePath, 'utf8'));
          await setKVData(newKey, fileData);
          console.log(`Migrated ${oldFile} to ${newKey} storage`);
        }
      } catch (error) {
        console.error(`Error migrating ${oldFile}:`, error);
      }
    }
    
    console.log('Data migration completed');
    return true;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
}

/**
 * Initialize storage and migrate data if needed
 */
async function initializeStorage() {
  try {
    // Check if we need to migrate data
    const fs = require('fs');
    const path = require('path');
    
    // Check if old data files exist
    const oldFiles = ['emailQueue.json', 'templates.json', 'user.json'];
    const hasOldData = oldFiles.some(file => 
      fs.existsSync(path.join(process.cwd(), 'data', file))
    );
    
    if (hasOldData) {
      console.log('Found old data files, migrating to new storage...');
      await migrateDataFromFiles();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

// Export all functions for use in other modules
module.exports = {
  getEmailQueue,
  setEmailQueue,
  getEmailTemplates,
  setEmailTemplates,
  getUsers,
  setUsers,
  getTags,
  setTags,
  getEmailCounters,
  setEmailCounters,
  getProcessingStats,
  setProcessingStats,
  getScheduledEmails,
  setScheduledEmails,
  getFailedEmails,
  setFailedEmails,
  migrateDataFromFiles,
  initializeStorage
};
