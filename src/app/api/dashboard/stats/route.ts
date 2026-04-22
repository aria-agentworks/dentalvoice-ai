import { db, isDbAvailable } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getDemoDashboardStats } from '@/lib/demo-data';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
  try {
    if (!isDbAvailable || !db) {
      return NextResponse.json(getDemoDashboardStats());
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [
      totalPatients,
      todayCalls,
      totalCalls,
      upcomingAppointments,
      todayCompletedCalls,
      weekCalls,
      avgCallDuration,
      todayBookings,
      activePatients,
    ] = await Promise.all([
      db.patient.count(),
      db.call.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      db.call.count(),
      db.appointment.count({
        where: {
          date: { gte: todayStart },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
      db.call.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          status: 'completed',
        },
      }),
      db.call.count({
        where: {
          createdAt: { gte: weekStart, lte: weekEnd },
          status: 'completed',
        },
      }),
      db.call.aggregate({
        where: { status: 'completed', duration: { not: null } },
        _avg: { duration: true },
      }),
      db.call.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
          outcome: 'appointment_booked',
        },
      }),
      db.patient.count({
        where: {
          calls: { some: { createdAt: { gte: subDays(now, 30) } } },
        },
      }),
    ]);

    const recentCalls = await db.call.findMany({
      take: 10,
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });

    const upcomingApptList = await db.appointment.findMany({
      where: {
        date: { gte: todayStart },
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: { patient: true },
      orderBy: { date: 'asc' },
      take: 5,
    });

    const callsThisWeek: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const count = await db.call.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });
      callsThisWeek.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    return NextResponse.json({
      totalPatients,
      todayCalls,
      totalCalls,
      upcomingAppointments,
      todayCompletedCalls,
      weekCalls,
      avgCallDuration: avgCallDuration._avg.duration ? Math.round(avgCallDuration._avg.duration) : 0,
      todayBookings,
      activePatients,
      recentCalls,
      upcomingApptList,
      callsThisWeek,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(getDemoDashboardStats());
  }
}
