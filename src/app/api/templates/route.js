import { NextResponse } from 'next/server';
import { getEmailTemplates, setEmailTemplates } from '@/lib/kvStorage';

export async function GET() {
  try {
    const templatesData = await getEmailTemplates();
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
    
    const templatesData = await getEmailTemplates();
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      body: templateBody,
      createdAt: new Date().toISOString()
    };
    
    templatesData.templates.push(newTemplate);
    
    if (await setEmailTemplates(templatesData)) {
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
    
    const templatesData = await getEmailTemplates();
    templatesData.templates = templatesData.templates.filter(
      template => template.id !== id
    );
    
    if (await setEmailTemplates(templatesData)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 