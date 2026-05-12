import { NextRequest, NextResponse } from 'next/server';
import { getSettings, upsertSetting } from '@/lib/db-queries';

export async function GET() {
  try {
    const settings = await getSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = Object.entries(body) as [string, string][];
    const results = await Promise.all(
      updates.map(([key, value]) => upsertSetting(key, value))
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
