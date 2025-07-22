import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TEMPLATES_FILE_PATH = path.join(process.cwd(), 'data', 'templates.json');

const readTemplates = () => {
  try {
    const data = fs.readFileSync(TEMPLATES_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { templates: [] };
  }
};

const writeTemplates = (templates) => {
  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(TEMPLATES_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(TEMPLATES_FILE_PATH, JSON.stringify(templates, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing templates:', error);
    return false;
  }
};

export async function GET() {
  try {
    const templatesData = readTemplates();
    return NextResponse.json(templatesData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, subject, body: templateBody } = body;
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const templatesData = readTemplates();
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      body: templateBody,
      createdAt: new Date().toISOString()
    };
    
    templatesData.templates.push(newTemplate);
    
    if (writeTemplates(templatesData)) {
      return NextResponse.json(newTemplate);
    } else {
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    const templatesData = readTemplates();
    templatesData.templates = templatesData.templates.filter(
      template => template.id !== id
    );
    
    if (writeTemplates(templatesData)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 