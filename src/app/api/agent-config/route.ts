import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = await db.agentConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Agent config not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching agent config:', error);
    return NextResponse.json({ error: 'Failed to fetch agent config' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const config = await db.agentConfig.findFirst();

    if (!config) {
      const newConfig = await db.agentConfig.create({ data: body });
      return NextResponse.json(newConfig);
    }

    const updated = await db.agentConfig.update({
      where: { id: config.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating agent config:', error);
    return NextResponse.json({ error: 'Failed to update agent config' }, { status: 500 });
  }
}
