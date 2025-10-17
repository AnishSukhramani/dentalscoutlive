import fs from 'fs';
import path from 'path';

// Fallback to JSON files if Supabase is not configured
export const useFallbackStorage = () => {
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  return !isSupabaseConfigured;
};

// Read JSON file with fallback
export const readJsonFile = async (filename) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const data = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`File ${filename} not found, using default`);
    return { queue: [], templates: [] };
  }
};

// Write JSON file with fallback
export const writeJsonFile = async (filename, data) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const dataDir = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};
