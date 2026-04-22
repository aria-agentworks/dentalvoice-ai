import { PrismaClient } from "@prisma/client";
import { addDays, subDays, subHours, subMinutes } from "date-fns";

const prisma = new PrismaClient();

const SYSTEM_PROMPT = `You are a friendly and professional dental receptionist for Bright Smile Dental. Your role is to:
1. Greet patients warmly and professionally
2. Help schedule, reschedule, or cancel appointments
3. Answer common questions about services (cleaning, checkups, whitening, emergencies, consultations)
4. Provide office hours: Monday-Friday 8AM-6PM, Saturday 9AM-2PM, Closed Sunday
5. Address: 123 Dental Way, Suite 100, Springfield
6. Handle insurance inquiries - we accept most major dental insurance plans (Delta Dental, Cigna, Aetna, MetLife)
7. For emergencies outside business hours, direct patients to call 911 or visit the nearest ER
8. Collect patient name and phone number for new appointments
9. Confirm appointment details before ending the call
10. Transfer to a human receptionist if the patient requests or if you cannot help

Always be empathetic, clear, and concise. Never provide medical advice — only scheduling and general office information. If a patient expresses pain or a dental emergency, prioritize scheduling them as soon as possible.`;

async function main() {
  // Clear existing data
  await prisma.call.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.agentConfig.deleteMany();

  // Create patients
  const patients = await prisma.patient.createMany({
    data: [
      { firstName: "Sarah", lastName: "Johnson", phone: "(555) 234-5678", email: "sarah.johnson@email.com", dateOfBirth: "1985-03-15", insurance: "Delta Dental PPO", notes: "Prefers morning appointments" },
      { firstName: "Michael", lastName: "Chen", phone: "(555) 345-6789", email: "mchen@email.com", dateOfBirth: "1990-07-22", insurance: "Cigna Dental", notes: "Allergic to latex" },
      { firstName: "Emily", lastName: "Rodriguez", phone: "(555) 456-7890", email: "emily.r@email.com", dateOfBirth: "1978-11-08", insurance: "Aetna Dental", notes: "" },
      { firstName: "James", lastName: "Williams", phone: "(555) 567-8901", email: "jwilliams@email.com", dateOfBirth: "1995-01-30", insurance: "MetLife Dental", notes: "New patient - referred by Dr. Smith" },
      { firstName: "Lisa", lastName: "Thompson", phone: "(555) 678-9012", email: "lisa.t@email.com", dateOfBirth: "1982-09-14", insurance: "Delta Dental HMO", notes: "Anxiety patient - needs extra care" },
      { firstName: "David", lastName: "Kim", phone: "(555) 789-0123", email: "dkim@email.com", dateOfBirth: "1988-05-20", insurance: "United Healthcare Dental", notes: "" },
      { firstName: "Amanda", lastName: "Davis", phone: "(555) 890-1234", email: "amanda.d@email.com", dateOfBirth: "1992-12-03", insurance: "", notes: "Self-pay patient" },
      { firstName: "Robert", lastName: "Martinez", phone: "(555) 901-2345", email: "rmartinez@email.com", dateOfBirth: "1975-04-18", insurance: "Cigna Dental", notes: "Regular 6-month checkups" },
      { firstName: "Jennifer", lastName: "Anderson", phone: "(555) 012-3456", email: "janderson@email.com", dateOfBirth: "1983-08-27", insurance: "Aetna Dental", notes: "Whitening consultation needed" },
      { firstName: "Christopher", lastName: "Taylor", phone: "(555) 123-4567", email: "ctaylor@email.com", dateOfBirth: "1997-02-11", insurance: "MetLife Dental", notes: "" },
      { firstName: "Nicole", lastName: "Brown", phone: "(555) 234-5679", email: "nbrown@email.com", dateOfBirth: "1989-06-25", insurance: "Delta Dental PPO", notes: "Emergency contact: John Brown (555) 234-5680" },
      { firstName: "Thomas", lastName: "Wilson", phone: "(555) 345-6790", email: "twilson@email.com", dateOfBirth: "1980-10-09", insurance: "Guardian Dental", notes: "Needs crown replacement" },
      { firstName: "Jessica", lastName: "Garcia", phone: "(555) 456-7891", email: "jgarcia@email.com", dateOfBirth: "1993-07-31", insurance: "Humana Dental", notes: "" },
      { firstName: "Daniel", lastName: "Lee", phone: "(555) 567-8902", email: "dlee@email.com", dateOfBirth: "1986-03-19", insurance: "Cigna Dental", notes: "Prefers Dr. Patterson" },
      { firstName: "Rachel", lastName: "Moore", phone: "(555) 678-9013", email: "rmoore@email.com", dateOfBirth: "1991-11-22", insurance: "Aetna Dental", notes: "Orthodontic consultation follow-up" },
      { firstName: "Kevin", lastName: "Clark", phone: "(555) 789-0124", email: "kclark@email.com", dateOfBirth: "1974-01-07", insurance: "Delta Dental", notes: "Wisdom teeth evaluation needed" },
      { firstName: "Megan", lastName: "Harris", phone: "(555) 890-1235", email: "mharris@email.com", dateOfBirth: "1998-09-05", insurance: "", notes: "New patient" },
      { firstName: "Brian", lastName: "Lewis", phone: "(555) 901-2346", email: "blewis@email.com", dateOfBirth: "1981-04-29", insurance: "MetLife Dental", notes: "Regular patient" },
    ],
  });

  const allPatients = await prisma.patient.findMany();

  // Helper to get random patient
  const rp = () => allPatients[Math.floor(Math.random() * allPatients.length)];
  const now = new Date();

  // Create appointments
  const appointmentData = [
    { patientId: allPatients[0].id, date: addDays(now, 1).toISOString(), duration: 30, type: "cleaning", status: "confirmed", notes: "Regular cleaning" },
    { patientId: allPatients[1].id, date: addDays(now, 1).toISOString(), duration: 45, type: "checkup", status: "scheduled", notes: "Annual checkup" },
    { patientId: allPatients[2].id, date: addDays(now, 2).toISOString(), duration: 60, type: "emergency", status: "confirmed", notes: "Tooth pain - upper right" },
    { patientId: allPatients[3].id, date: addDays(now, 3).toISOString(), duration: 30, type: "consultation", status: "scheduled", notes: "New patient consultation" },
    { patientId: allPatients[4].id, date: addDays(now, 5).toISOString(), duration: 30, type: "cleaning", status: "scheduled", notes: "" },
    { patientId: allPatients[5].id, date: addDays(now, 7).toISOString(), duration: 60, type: "whitening", status: "confirmed", notes: "Zoom whitening procedure" },
    { patientId: allPatients[6].id, date: subDays(now, 1).toISOString(), duration: 30, type: "checkup", status: "completed", notes: "Routine checkup" },
    { patientId: allPatients[7].id, date: subDays(now, 2).toISOString(), duration: 45, type: "cleaning", status: "completed", notes: "" },
    { patientId: allPatients[8].id, date: addDays(now, 4).toISOString(), duration: 30, type: "consultation", status: "scheduled", notes: "Whitening options" },
    { patientId: allPatients[9].id, date: subDays(now, 3).toISOString(), duration: 30, type: "checkup", status: "no-show", notes: "Patient did not show" },
    { patientId: allPatients[10].id, date: addDays(now, 6).toISOString(), duration: 30, type: "cleaning", status: "scheduled", notes: "" },
    { patientId: allPatients[11].id, date: addDays(now, 10).toISOString(), duration: 60, type: "checkup", status: "scheduled", notes: "Crown replacement consultation" },
    { patientId: allPatients[12].id, date: subDays(now, 5).toISOString(), duration: 30, type: "emergency", status: "completed", notes: "Chipped tooth repair" },
    { patientId: allPatients[0].id, date: subDays(now, 7).toISOString(), duration: 30, type: "cleaning", status: "completed", notes: "" },
    { patientId: allPatients[13].id, date: addDays(now, 8).toISOString(), duration: 30, type: "checkup", status: "scheduled", notes: "" },
  ];

  await prisma.appointment.createMany({ data: appointmentData });

  // Create calls
  const outcomes = ["appointment_booked", "rescheduled", "cancelled", "information", "voicemail", "no_answer", "transferred", "spam"];
  const sentiments = ["positive", "neutral", "negative"];
  const directions = ["inbound", "outbound"];
  const statuses = ["completed", "completed", "completed", "completed", "failed", "voicemail", "transferred"];

  const transcripts = [
    "Patient called to schedule a routine cleaning. Collected name and phone number. Booked appointment for next Tuesday at 10 AM. Patient confirmed.",
    "Patient inquired about whitening services. Provided information about Zoom whitening and take-home kits. Scheduled consultation.",
    "Patient called to cancel tomorrow's appointment due to work conflict. Rescheduled to Friday at 2 PM.",
    "New patient calling for information about services and pricing. Provided overview and scheduled initial consultation.",
    "Patient reported tooth pain since yesterday. Scheduled emergency appointment for same day at 3 PM. Advised to take over-the-counter pain relief.",
    "Patient called to confirm their upcoming appointment. Confirmed details: Thursday at 11 AM for cleaning.",
    "Patient inquired about insurance acceptance. Confirmed we accept Delta Dental, Cigna, Aetna, and MetLife.",
    "Patient requested to be transferred to human receptionist regarding billing question. Transferred successfully.",
    "Left voicemail confirming appointment details for upcoming visit on Monday.",
    "No answer - left voicemail requesting callback to schedule 6-month checkup.",
    "Patient expressed dissatisfaction with wait times during last visit. Apologized and offered priority scheduling for next appointment.",
    "Patient asked about office hours and location. Provided: Mon-Fri 8AM-6PM, Sat 9AM-2PM, 123 Dental Way Suite 100, Springfield.",
    "Spam call - telemarketer offering dental supplies. Politely declined.",
    "Patient called to reschedule from morning to afternoon. Moved appointment from 9 AM to 3 PM same day.",
    "Patient called with questions about post-procedure care after crown placement. Provided general care instructions.",
    "Patient requested appointment for child's first dental visit. Scheduled pediatric consultation.",
    "Called patient to remind about upcoming appointment tomorrow. Patient confirmed attendance.",
    "Patient inquired about emergency services. Explained same-day emergency availability.",
    "Patient called to update insurance information from Cigna to Aetna. Updated records.",
    "Patient expressed gratitude for excellent service during last visit. Noted positive feedback.",
    "Patient asked about teeth whitening options and pricing. Provided detailed information about in-office and take-home options.",
    "Patient requested referral to orthodontist. Provided referral information for Dr. Park.",
    "Patient called to cancel appointment due to illness. Will call back to reschedule when feeling better.",
    "Insurance verification call. Confirmed patient's Delta Dental coverage is active.",
    "Patient asked about payment plans for major dental work. Explained available financing options.",
    "Patient called to confirm address for GPS navigation. Provided: 123 Dental Way, Suite 100, Springfield.",
    "Outbound call to follow up on missed appointment. Patient requested reschedule - booked for next week.",
    "Patient inquired about Invisalign consultation. Scheduled initial assessment.",
    "Patient called about billing discrepancy. Transferred to billing department for resolution.",
  ];

  const callData = [];
  for (let i = 0; i < 30; i++) {
    const hasPatient = Math.random() > 0.1;
    const patient = hasPatient ? rp() : null;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const duration = status === "completed" ? Math.floor(Math.random() * 300) + 30 : status === "voicemail" ? Math.floor(Math.random() * 60) + 10 : null;
    const outcome = status === "completed" ? outcomes[Math.floor(Math.random() * outcomes.length)] : null;
    const sentiment = status === "completed" && !["spam", "no_answer"].includes(outcome!) ? sentiments[Math.floor(Math.random() * sentiments.length)] : null;
    const hoursAgo = Math.floor(Math.random() * 720) + 1; // up to 30 days ago
    const createdAt = subHours(now, hoursAgo);

    callData.push({
      patientId: patient?.id || null,
      direction: directions[Math.floor(Math.random() * directions.length)],
      status,
      duration,
      outcome,
      transcript: status === "completed" && hasPatient ? transcripts[i % transcripts.length] : null,
      sentiment,
      providerCallId: `call_${Date.now()}_${i}`,
      createdAt: createdAt.toISOString(),
    });
  }

  await prisma.call.createMany({ data: callData });

  // Create agent config
  await prisma.agentConfig.create({
    data: {
      name: "Dental Receptionist",
      provider: "vapi",
      voiceId: "alloy",
      model: "gpt-4o",
      systemPrompt: SYSTEM_PROMPT,
      welcomeMessage: "Good morning! Thank you for calling Bright Smile Dental. This is your AI dental assistant. How can I help you today?",
      maxDuration: 300,
      transferNumber: "+15551002000",
      languages: "en",
      isActive: true,
    },
  });

  console.log("Seed data created successfully!");
  console.log(`- ${allPatients.length} patients`);
  console.log(`- ${appointmentData.length} appointments`);
  console.log(`- ${callData.length} calls`);
  console.log("- 1 agent config");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
