import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'user.json');

const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
};

export async function GET() {
  try {
    const usersData = readUsers();
    return NextResponse.json(usersData);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to read users' }, { status: 500 });
  }
}