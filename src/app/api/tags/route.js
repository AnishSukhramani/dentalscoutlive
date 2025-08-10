import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const tagsFilePath = path.join(process.cwd(), 'data', 'tags.json');

// Helper function to read tags from file
const readTagsFile = () => {
  try {
    if (fs.existsSync(tagsFilePath)) {
      const data = fs.readFileSync(tagsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading tags file:', error);
  }
  return { tags: [], lastUpdated: null };
};

// Helper function to write tags to file
const writeTagsFile = (data) => {
  try {
    const dir = path.dirname(tagsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(tagsFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tags file:', error);
    return false;
  }
};

// GET - Retrieve all tags
export async function GET() {
  try {
    const tagsData = readTagsFile();
    return NextResponse.json(tagsData);
  } catch (error) {
    console.error('Error in GET /api/tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST - Add new tag
export async function POST(request) {
  try {
    const { tagName } = await request.json();
    
    if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const trimmedTagName = tagName.trim();
    const tagsData = readTagsFile();
    
    // Check if tag already exists (case-insensitive)
    const tagExists = tagsData.tags.some(tag => 
      tag.toLowerCase() === trimmedTagName.toLowerCase()
    );
    
    if (tagExists) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }
    
    // Add new tag
    tagsData.tags.push(trimmedTagName);
    tagsData.tags.sort(); // Keep tags sorted
    tagsData.lastUpdated = new Date().toISOString();
    
    const success = writeTagsFile(tagsData);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save tag' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      tag: trimmedTagName,
      tags: tagsData.tags 
    });
  } catch (error) {
    console.error('Error in POST /api/tags:', error);
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 });
  }
}

// PUT - Update tags (for bulk operations)
export async function PUT(request) {
  try {
    const { tags } = await request.json();
    
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
    }
    
    // Remove duplicates and sort
    const uniqueTags = [...new Set(tags.map(tag => tag.trim()).filter(tag => tag !== ''))].sort();
    
    const tagsData = {
      tags: uniqueTags,
      lastUpdated: new Date().toISOString()
    };
    
    const success = writeTagsFile(tagsData);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      tags: uniqueTags 
    });
  } catch (error) {
    console.error('Error in PUT /api/tags:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}
