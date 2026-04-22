import { db, isDbAvailable } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getDemoAgentConfig } from '@/lib/demo-data';

export async function GET() {
  try {
    if (!isDbAvailable || !db) {
      return NextResponse.json(getDemoAgentConfig());
    }

    const config = await db.agentConfig.findFirst();
    if (!config) {
      return NextResponse.json(getDemoAgentConfig());
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching agent config:', error);
    return NextResponse.json(getDemoAgentConfig());
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isDbAvailable || !db) {
      return NextResponse.json({ message: 'Config updated (demo mode)', ...getDemoAgentConfig(), ...body });
    }

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
