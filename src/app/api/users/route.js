import { NextResponse } from 'next/server';
const { getUsers } = require('@/lib/kvStorage');

export async function GET() {
  try {
    const usersData = await getUsers();
    return NextResponse.json(usersData);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 });
  }
}