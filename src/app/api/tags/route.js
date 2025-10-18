import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Retrieve all unique tags from practices table
export async function GET() {
  try {
    // Get all unique tags from practices table
    const { data: tags, error } = await supabase
      .from('practices')
      .select('tags')
      .not('tags', 'is', null);

    if (error) {
      console.error('Error fetching tags from practices:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Extract and deduplicate tags
    const allTags = [];
    tags.forEach(practice => {
      if (practice.tags && Array.isArray(practice.tags)) {
        allTags.push(...practice.tags);
      }
    });

    const uniqueTags = [...new Set(allTags)].sort();
    
    return NextResponse.json({ 
      tags: uniqueTags,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /api/tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST - Add new tag (this will be automatically handled when adding tags to practices)
export async function POST(request) {
  try {
    const { tagName } = await request.json();
    
    if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const trimmedTagName = tagName.trim();
    
    // Check if tag already exists by querying practices table
    const { data: existingTags, error: fetchError } = await supabase
      .from('practices')
      .select('tags')
      .not('tags', 'is', null);

    if (fetchError) {
      console.error('Error checking existing tags:', fetchError);
      return NextResponse.json({ error: 'Failed to check existing tags' }, { status: 500 });
    }

    // Check if tag already exists
    const tagExists = existingTags.some(practice => 
      practice.tags && practice.tags.includes(trimmedTagName)
    );
    
    if (tagExists) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }
    
    // Since tags are stored in practices table, we just return success
    // The tag will be created when it's first used in a practice
    return NextResponse.json({ 
      success: true, 
      tag: trimmedTagName,
      message: 'Tag will be created when first used in a practice'
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
    
    // Since tags are managed through practices table, we just return the processed tags
    return NextResponse.json({ 
      success: true, 
      tags: uniqueTags,
      message: 'Tags are managed through practices table'
    });
  } catch (error) {
    console.error('Error in PUT /api/tags:', error);
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 });
  }
}