import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      db.patient.findMany({
        where,
        include: {
          _count: { select: { calls: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.patient.count({ where }),
    ]);

    return NextResponse.json({ patients, total, page, limit });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, dateOfBirth, insurance, notes } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json({ error: 'First name, last name, and phone are required' }, { status: 400 });
    }

    const patient = await db.patient.create({
      data: { firstName, lastName, phone, email, dateOfBirth, insurance, notes },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating patient:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'A patient with this phone number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
