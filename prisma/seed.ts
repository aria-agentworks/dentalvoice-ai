import { PrismaClient } from '@prisma/client';
import { subDays, subHours, addHours, addDays, format } from 'date-fns';

const prisma = new PrismaClient();

const firstNames = ['Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Jackson', 'Emily', 'Sebastian', 'Liam', 'Ava', 'Noah'];
const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez'];
const insurances = ['Delta Dental PPO', 'Cigna Dental', 'Aetna Dental', 'MetLife Dental', 'Guardian Dental', 'Humana Dental', 'United Concordia', 'BlueCross BlueShield', null, null];
const apptTypes = ['checkup', 'cleaning', 'emergency', 'consultation', 'whitening'];
const outcomes = ['appointment_booked', 'rescheduled', 'cancelled', 'information', 'transferred', 'no_answer', 'voicemail'];
const sentiments = ['positive', 'neutral', 'negative'];
const directions = ['inbound', 'outbound'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPhone(): string {
  const area = randomFrom(['212', '310', '312', '415', '512', '617', '646', '702', '720', '832', '949', '956', '206', '404', '469']);
  const mid = String(randomBetween(200, 999));
  const end = String(randomBetween(1000, 9999));
  return `(${area}) ${mid}-${end}`;
}

async function main() {
  // Clear existing data
  await prisma.call.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.agentConfig.deleteMany();

  // Create agent config
  await prisma.agentConfig.create({
    data: {
      name: 'Bright Smile Dental Receptionist',
      provider: 'vapi',
      voiceId: 'nova',
      model: 'gpt-4o',
      systemPrompt: `You are the friendly and professional AI receptionist for Bright Smile Dental, a modern dental practice in Austin, TX.

YOUR ROLE:
- Answer incoming calls warmly and professionally
- Help patients schedule, reschedule, or cancel appointments
- Provide office hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM, Sun Closed
- Answer common questions about services, insurance, parking, and location
- Transfer complex or urgent matters to a human staff member

SERVICES WE OFFER:
- General checkups and cleanings
- Teeth whitening (in-office and take-home kits)
- Emergency dental care
- Cosmetic consultations
- Pediatric dentistry
- Root canals, crowns, and fillings
- Orthodontic referrals

INSURANCE WE ACCEPT:
- Delta Dental PPO, Cigna, Aetna, MetLife, Guardian, Humana
- We also offer a 15% discount for self-pay patients
- Payment plans available for treatments over $500

LOCATION & PARKING:
- 1234 Medical Parkway, Suite 200, Austin, TX 78731
- Free parking in the attached garage, Level 2
- Near bus route #5 (Medical Center stop)

IMPORTANT RULES:
- Always be polite, patient, and empathetic
- Never make medical diagnoses or give medical advice
- If a patient sounds distressed or in pain, prioritize scheduling them ASAP
- Always confirm appointment details before hanging up
- If you cannot help, transfer to the front desk at the configured number
- Keep calls under 5 minutes unless the patient needs more time`,
      welcomeMessage: 'Good morning! Thank you for calling Bright Smile Dental. My name is Alex, how can I help you today?',
      maxDuration: 300,
      transferNumber: '+15125551999',
      languages: 'en',
      isActive: true,
    },
  });

  // Create patients
  const patients = [];
  const patientCount = 42;
  for (let i = 0; i < patientCount; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const phone = randomPhone();
    const dobYear = randomBetween(1955, 2005);
    const dobMonth = randomBetween(1, 12);
    const dobDay = randomBetween(1, 28);

    patients.push(
      await prisma.patient.create({
        data: {
          firstName,
          lastName,
          phone,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomBetween(1, 99)}@email.com`,
          dateOfBirth: `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`,
          insurance: randomFrom(insurances),
          notes: i < 5 ? 'New patient - first visit' : i < 10 ? 'Prefers morning appointments' : null,
        },
      })
    );
  }

  // Create calls over the last 30 days
  const calls = [];
  for (let i = 0; i < 180; i++) {
    const daysAgo = randomBetween(0, 29);
    const hoursAgo = randomBetween(0, 23);
    const callDate = subDays(new Date(), daysAgo);
    callDate.setHours(hoursAgo, randomBetween(0, 59), randomBetween(0, 59), 0);

    const direction = randomFrom(directions);
    const outcome = randomFrom(outcomes);
    const duration = outcome === 'no_answer' ? 0 : outcome === 'voicemail' ? randomBetween(10, 30) : randomBetween(45, 420);
    const status = outcome === 'no_answer' ? 'failed' : 'completed';

    // Generate transcript for completed calls
    const transcript = outcome !== 'no_answer' ? generateTranscript(outcome, direction) : null;

    calls.push(
      await prisma.call.create({
        data: {
          patientId: randomFrom(patients).id,
          direction,
          status,
          duration,
          outcome,
          transcript,
          sentiment: randomFrom(sentiments),
          providerCallId: `call_${randomBetween(100000, 999999)}`,
          createdAt: callDate,
        },
      })
    );
  }

  // Create upcoming appointments
  const appointmentNotes = [
    'Patient requested 2pm slot',
    'Follow-up from cleaning last month',
    'Emergency consultation - reported tooth pain',
    null,
    'First visit - needs full exam',
    'Insurance verification pending',
    null,
    'Referred by Dr. Smith',
    null,
    'Requested hygienist: Maria',
  ];

  for (let i = 0; i < 25; i++) {
    const daysAhead = randomBetween(0, 21);
    const hour = randomBetween(8, 17);
    const minute = randomFrom([0, 15, 30, 45]);
    const apptDate = addDays(new Date(), daysAhead);
    apptDate.setHours(hour, minute, 0, 0);

    const status = daysAhead === 0 ? 'confirmed' : randomFrom(['scheduled', 'confirmed', 'scheduled', 'scheduled', 'confirmed']);

    // Only create if it's in the future
    if (apptDate > new Date()) {
      await prisma.appointment.create({
        data: {
          patientId: randomFrom(patients).id,
          date: apptDate,
          duration: randomFrom([30, 30, 30, 45, 60, 60, 90]),
          type: randomFrom(apptTypes),
          status,
          notes: randomFrom(appointmentNotes),
        },
      });
    }
  }

  // Create some past appointments
  for (let i = 0; i < 35; i++) {
    const daysAgo = randomBetween(1, 45);
    const hour = randomBetween(8, 17);
    const minute = randomFrom([0, 15, 30, 45]);
    const apptDate = subDays(new Date(), daysAgo);
    apptDate.setHours(hour, minute, 0, 0);

    const status = randomFrom(['completed', 'completed', 'completed', 'cancelled', 'no-show']);

    await prisma.appointment.create({
      data: {
        patientId: randomFrom(patients).id,
        date: apptDate,
        duration: randomFrom([30, 30, 45, 60, 90]),
        type: randomFrom(apptTypes),
        status,
        notes: randomFrom(appointmentNotes),
      },
    });
  }

  console.log('Seed complete:');
  console.log(`  - ${patientCount} patients created`);
  console.log(`  - ${calls.length} calls created`);
  console.log(`  - 60 appointments created`);
  console.log(`  - 1 agent config created`);
}

function generateTranscript(outcome: string, direction: string): string {
  const transcripts: Record<string, string[]> = {
    appointment_booked: [
      `Agent: Good morning! Thank you for calling Bright Smile Dental, this is Alex. How can I help you today?\nPatient: Hi, I'd like to schedule a cleaning appointment.\nAgent: Of course! I'd be happy to help with that. Let me check our available times. When works best for you?\nPatient: Sometime next week, preferably Tuesday morning.\nAgent: Great news — we have Tuesday at 9:15 AM and 10:30 AM available. Which would you prefer?\nPatient: 9:15 sounds perfect.\nAgent: Wonderful! I have you down for a teeth cleaning on Tuesday at 9:15 AM. Could I get your name and phone number to confirm?\nPatient: Sure, it's [patient name], [phone number].\nAgent: Perfect, you're all set! We'll send you a reminder the day before. Is there anything else I can help with?\nPatient: No, that's it. Thank you!\nAgent: You're welcome! See you Tuesday, have a great day!`,
      `Agent: Good afternoon, Bright Smile Dental, Alex speaking.\nPatient: Hello, I need to book a checkup. It's been about a year since my last visit.\nAgent: Welcome back! Let me pull up your records. I can get you in this Thursday at 2 PM or Friday at 11 AM. Do either of those work?\nPatient: Thursday at 2 works.\nAgent: Excellent! I've scheduled your checkup for Thursday at 2 PM. We'll do a full exam and cleaning. Do you have any updated insurance information?\nPatient: Same as before, Delta Dental.\nAgent: Perfect, that's on file. We'll verify your coverage before your visit. Anything else I can help with?\nPatient: No, thanks!\nAgent: See you Thursday!`,
    ],
    rescheduled: [
      `Agent: Good morning, Bright Smile Dental!\nPatient: Hi, I have an appointment on Wednesday but I need to reschedule. Something came up at work.\nAgent: No problem at all! Let me find a new time for you. How about Friday at 3 PM instead?\nPatient: That would work great.\nAgent: Done! I've moved your appointment to Friday at 3 PM. We'll send you the updated confirmation. Anything else?\nPatient: No, that's all. Thanks for being flexible.\nAgent: Happy to help! See you Friday.`,
    ],
    cancelled: [
      `Agent: Good morning, Bright Smile Dental!\nPatient: Hi, I need to cancel my appointment next week. I'm going out of town unexpectedly.\nAgent: I'm sorry to hear that, but I can certainly cancel that for you. Would you like to reschedule for when you return?\nPatient: Not right now, I'll call back when I know my schedule.\nAgent: Absolutely. Your appointment has been cancelled. Feel free to call us anytime to book a new one. Have a safe trip!\nPatient: Thank you, goodbye.\nAgent: Goodbye!`,
    ],
    information: [
      `Agent: Thank you for calling Bright Smile Dental, Alex speaking!\nPatient: Hi, I was wondering what your office hours are and if you accept Cigna insurance?\nAgent: Great questions! We're open Monday through Friday 8 AM to 6 PM, and Saturday 9 AM to 2 PM. We're closed on Sundays. And yes, we do accept Cigna Dental plans!\nPatient: Perfect. And where are you located?\nAgent: We're at 1234 Medical Parkway, Suite 200, in Austin. There's free parking in the attached garage on Level 2.\nPatient: Great, thanks!\nAgent: Would you like to schedule an appointment?\nPatient: Not today, but I'll keep you in mind.\nAgent: Sounds good! Have a wonderful day!`,
      `Agent: Bright Smile Dental, how can I help you?\nPatient: Hi, do you do teeth whitening? And what's the cost?\nAgent: Yes, we do! We offer both in-office whitening for $399 and take-home kits for $199. The in-office treatment takes about an hour and gives immediate results, while the take-home kit gives gradual results over two weeks.\nPatient: Interesting. Do you have any payment plans?\nAgent: We do! For treatments over $500, we offer 6-month interest-free financing. We also give a 15% discount for self-pay patients.\nPatient: That's helpful, thank you.\nAgent: Would you like to book a whitening consultation?\nPatient: Let me think about it and I'll call back.\nAgent: Of course! We're here anytime. Have a great day!`,
    ],
    transferred: [
      `Agent: Good morning, Bright Smile Dental!\nPatient: Hi, I have a question about my bill from last month. The charges don't match what my insurance said they'd cover.\nAgent: I understand billing questions can be frustrating. Let me transfer you to our billing coordinator who can look into this for you right away. Please hold for just a moment.\nPatient: Thank you.\nAgent: Transferring now...`,
    ],
    voicemail: [
      `[Voicemail] Hi, this is a message for Bright Smile Dental. My name is [patient name] and my number is [phone number]. I was hoping to schedule a cleaning sometime next week. Give me a call back when you get a chance. Thanks!`,
    ],
  };

  const options = transcripts[outcome] || transcripts['information']!;
  return randomFrom(options);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
