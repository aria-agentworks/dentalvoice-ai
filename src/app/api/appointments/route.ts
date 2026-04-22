import { db, isDbAvailable } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getDemoAppointments } from '@/lib/demo-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!isDbAvailable || !db) {
      return NextResponse.json(getDemoAppointments(page, limit));
    }

    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const patientId = searchParams.get('patientId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const upcoming = searchParams.get('upcoming');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (patientId) where.patientId = patientId;

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    if (upcoming === 'true') {
      where.date = { gte: new Date() };
      where.status = { in: ['scheduled', 'confirmed'] };
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        include: { patient: true },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({ appointments, total, page, limit });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(getDemoAppointments());
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, date, duration, type, notes } = body;

    if (!patientId || !date) {
      return NextResponse.json({ error: 'Patient ID and date are required' }, { status: 400 });
    }

    if (!isDbAvailable || !db) {
      return NextResponse.json({ message: 'Appointment recorded (demo mode)', ...body }, { status: 201 });
    }

    const appointment = await db.appointment.create({
      data: {
        patientId,
        date: new Date(date),
        duration: duration || 30,
        type: type || 'checkup',
        notes,
      },
      include: { patient: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
