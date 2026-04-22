// Demo data for when database is not available (e.g., Vercel deployment)
import { subDays, format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

const patientNames = [
  { firstName: 'Sarah', lastName: 'Johnson' },
  { firstName: 'Michael', lastName: 'Chen' },
  { firstName: 'Emily', lastName: 'Rodriguez' },
  { firstName: 'David', lastName: 'Kim' },
  { firstName: 'Jessica', lastName: 'Williams' },
  { firstName: 'James', lastName: 'Patel' },
  { firstName: 'Amanda', lastName: 'Garcia' },
  { firstName: 'Robert', lastName: 'Thompson' },
];

const makePatient = (i: number) => ({
  id: `demo-patient-${i}`,
  firstName: patientNames[i % patientNames.length].firstName,
  lastName: patientNames[i % patientNames.length].lastName,
  phone: `+1 555-${String(1000 + i * 137).slice(0, 3)}-${String(1000 + i * 251).slice(0, 4)}`,
  email: `patient${i}@demo.com`,
  dateOfBirth: '1985-03-15',
  insurance: ['Delta Dental', 'Cigna', 'Aetna', 'MetLife'][i % 4],
  notes: null,
  createdAt: subDays(new Date(), Math.floor(i * 3.5)).toISOString(),
  updatedAt: new Date().toISOString(),
});

const outcomes = ['appointment_booked', 'general_inquiry', 'rescheduled', 'voicemail', 'no_answer', 'callback_requested'];
const sentiments = ['positive', 'neutral', 'positive', 'neutral', 'negative'];
const directions = ['inbound', 'inbound', 'inbound', 'outbound'];
const callStatuses = ['completed', 'completed', 'completed', 'missed', 'voicemail'];

const makeCall = (i: number) => ({
  id: `demo-call-${i}`,
  patientId: `demo-patient-${i % patientNames.length}`,
  patient: makePatient(i % patientNames.length),
  direction: directions[i % directions.length],
  status: callStatuses[i % callStatuses.length],
  duration: [45, 120, 180, 90, 240, 60, 30, 150][i % 8],
  outcome: outcomes[i % outcomes.length],
  recordingUrl: null,
  transcript: null,
  sentiment: sentiments[i % sentiments.length],
  providerCallId: `vapi-call-${i}`,
  createdAt: subDays(new Date(), Math.floor(i * 0.6)).toISOString(),
});

const apptTypes = ['checkup', 'cleaning', 'whitening', 'filling', 'root_canal', 'crown', 'emergency', 'consultation'];

const makeAppointment = (i: number, upcoming: boolean) => {
  const date = upcoming
    ? new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000 + Math.floor(i / 3) * 3600000)
    : subDays(new Date(), (i + 1) * 2);
  return {
    id: `demo-appt-${i}-${upcoming ? 'up' : 'past'}`,
    patientId: `demo-patient-${i % patientNames.length}`,
    patient: makePatient(i % patientNames.length),
    date: date.toISOString(),
    duration: [30, 30, 60, 45, 90, 60, 30, 30][i % 8],
    type: apptTypes[i % apptTypes.length],
    status: upcoming ? (i % 3 === 0 ? 'confirmed' : 'scheduled') : 'completed',
    notes: null,
    createdAt: subDays(new Date(), i * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export function getDemoDashboardStats() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const recentCalls = Array.from({ length: 10 }, (_, i) => makeCall(i));
  const upcomingApptList = Array.from({ length: 5 }, (_, i) => makeAppointment(i, true));

  const callsThisWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    date: day,
    count: [12, 15, 18, 14, 22, 8, 0][i],
  }));

  return {
    totalPatients: 42,
    todayCalls: 8,
    totalCalls: 180,
    upcomingAppointments: 24,
    todayCompletedCalls: 6,
    weekCalls: 89,
    avgCallDuration: 127,
    todayBookings: 3,
    activePatients: 28,
    recentCalls,
    upcomingApptList,
    callsThisWeek,
  };
}

export function getDemoCalls(page: number = 1, limit: number = 50) {
  const allCalls = Array.from({ length: 50 }, (_, i) => makeCall(i));
  return { calls: allCalls.slice((page - 1) * limit, page * limit), total: 50, page, limit };
}

export function getDemoAppointments(page: number = 1, limit: number = 50) {
  const upcoming = Array.from({ length: 24 }, (_, i) => makeAppointment(i, true));
  const past = Array.from({ length: 35 }, (_, i) => makeAppointment(i, false));
  const all = [...upcoming, ...past].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { appointments: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
}

export function getDemoPatients(page: number = 1, limit: number = 50) {
  const patients = Array.from({ length: 42 }, (_, i) => makePatient(i));
  return { patients: patients.slice((page - 1) * limit, page * limit), total: 42, page, limit };
}

export function getDemoAnalytics() {
  const now = new Date();

  const callsOverTime: { date: string; inbound: number; outbound: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = subDays(now, i);
    const base = 4 + Math.floor(Math.random() * 8);
    callsOverTime.push({
      date: format(day, 'MMM dd'),
      inbound: base + Math.floor(Math.random() * 3),
      outbound: Math.floor(base * 0.2),
    });
  }

  const outcomeDistribution = [
    { name: 'appointment_booked', value: 62 },
    { name: 'general_inquiry', value: 45 },
    { name: 'rescheduled', value: 28 },
    { name: 'callback_requested', value: 18 },
    { name: 'voicemail', value: 15 },
    { name: 'no_answer', value: 12 },
  ];

  const sentimentBreakdown = [
    { name: 'positive', value: 98 },
    { name: 'neutral', value: 52 },
    { name: 'negative', value: 18 },
  ];

  const peakHours = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    calls: h >= 8 && h <= 17 ? Math.floor(3 + Math.random() * 12) : Math.floor(Math.random() * 2),
  }));

  const durationDistribution = [
    { range: '0-30s', count: 15 },
    { range: '30-60s', count: 28 },
    { range: '1-2m', count: 45 },
    { range: '2-3m', count: 38 },
    { range: '3-5m', count: 32 },
    { range: '5m+', count: 12 },
  ];

  return {
    callsOverTime,
    outcomeDistribution,
    sentimentBreakdown,
    peakHours,
    durationDistribution,
    kpis: {
      avgHandlingTime: 127,
      firstCallResolution: 87,
      bookingRate: 42,
      satisfactionScore: 78,
      totalCalls: 170,
      appointmentBooked: 62,
    },
    providerStats: [
      { provider: 'Vapi AI', calls: 119, avgDuration: 121, bookingRate: 44, satisfaction: 81 },
      { provider: 'Retell AI', calls: 34, avgDuration: 140, bookingRate: 40, satisfaction: 76 },
      { provider: 'Bland AI', calls: 17, avgDuration: 153, bookingRate: 38, satisfaction: 72 },
    ],
  };
}

export function getDemoAgentConfig() {
  return {
    id: 'demo-config',
    name: 'Dental Receptionist',
    provider: 'vapi',
    voiceId: 'nova',
    model: 'gpt-4o',
    systemPrompt: 'Dental front desk AI agent system prompt...',
    welcomeMessage: 'Good morning! Thank you for calling AA Dental.',
    maxDuration: 300,
    transferNumber: null,
    languages: 'en',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
