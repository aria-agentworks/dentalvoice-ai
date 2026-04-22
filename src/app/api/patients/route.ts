import { db, isDbAvailable } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getDemoPatients } from '@/lib/demo-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!isDbAvailable || !db) {
      return NextResponse.json(getDemoPatients(page, limit));
    }

    const search = searchParams.get('search');
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      db.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.patient.count({ where }),
    ]);

    return NextResponse.json({ patients, total, page, limit });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(getDemoPatients());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isDbAvailable || !db) {
      return NextResponse.json({ message: 'Patient created (demo mode)', ...body, id: 'demo-new' }, { status: 201 });
    }

    const patient = await db.patient.create({ data: body });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
