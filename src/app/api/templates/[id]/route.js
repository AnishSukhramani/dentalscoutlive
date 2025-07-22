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
    fs.writeFileSync(TEMPLATES_FILE_PATH, JSON.stringify(templates, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing templates:', error);
    return false;
  }
};

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, subject, body: templateBody } = body;
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const templatesData = readTemplates();
    const templateIndex = templatesData.templates.findIndex(template => template.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    // Update the template
    templatesData.templates[templateIndex] = {
      ...templatesData.templates[templateIndex],
      name,
      subject,
      body: templateBody,
      updatedAt: new Date().toISOString()
    };
    
    if (writeTemplates(templatesData)) {
      return NextResponse.json(templatesData.templates[templateIndex]);
    } else {
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
} 