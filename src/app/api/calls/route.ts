import { db, isDbAvailable } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getDemoCalls } from '@/lib/demo-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!isDbAvailable || !db) {
      return NextResponse.json(getDemoCalls(page, limit));
    }

    const status = searchParams.get('status');
    const outcome = searchParams.get('outcome');
    const direction = searchParams.get('direction');
    const sentiment = searchParams.get('sentiment');
    const patientId = searchParams.get('patientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (outcome) where.outcome = outcome;
    if (direction) where.direction = direction;
    if (sentiment) where.sentiment = sentiment;
    if (patientId) where.patientId = patientId;

    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        include: { patient: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.call.count({ where }),
    ]);

    return NextResponse.json({ calls, total, page, limit });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(getDemoCalls());
  }
}
