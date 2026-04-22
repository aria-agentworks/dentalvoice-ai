import { NextResponse } from 'next/server';
import { db, isDbAvailable } from '@/lib/db';

const DENTAL_SYSTEM_PROMPT = `You are Sarah, a friendly and professional dental receptionist at AA Dental. Your personality is warm, empathetic, and efficient.

Key Information:
- Office: AA Dental, located at 123 Dental Avenue, Suite 200
- Phone: (555) 123-4567
- Hours: Monday-Friday 8AM-6PM, Saturday 9AM-2PM, Closed Sundays
- Emergency line available 24/7 at the same number

Services Offered:
- General checkups and cleanings ($150-$300)
- Teeth whitening ($400-$600)
- Fillings ($200-$500)
- Root canals ($800-$1,500)
- Crowns and bridges ($1,000-$3,000)
- Invisalign clear aligners ($3,000-$5,000)
- Emergency dental care
- Pediatric dentistry

Insurance Accepted:
- Delta Dental
- Cigna
- Aetna
- MetLife
- Guardian
- United Healthcare
- BlueCross BlueShield

Your Responsibilities:
1. Greet every caller warmly by name if they provide it
2. Schedule, reschedule, or cancel appointments
3. Answer questions about services, pricing, and insurance
4. Handle emergency calls with urgency - offer same-day appointments for emergencies
5. Collect patient information (name, phone, date of birth, insurance)
6. Provide office directions and hours
7. Transfer complex medical questions to the dentist

Guidelines:
- Always be empathetic, especially with patients in pain
- Confirm all appointment details before hanging up
- For emergencies: "I understand this is urgent. Let me get you in right away. Can you come in within the next hour?"
- If you don't know something, say "Let me check with our team and get back to you" rather than making things up
- Keep conversations concise but caring
- Never discuss specific medical diagnoses - direct those to the dentist`;

const DENTAL_WELCOME = "Good morning! Thank you for calling AA Dental. This is Sarah, how can I help you today?";

// POST /api/vapi/assistant — Create a Vapi assistant
export async function POST() {
  try {
    const privateKey = process.env.VAPI_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Vapi private key not configured' }, { status: 500 });
    }

    // Get config from DB or use defaults
    let agentName = 'Dental Receptionist';
    let model = 'gpt-4o';
    let voiceId = 'nova';
    let systemPrompt = DENTAL_SYSTEM_PROMPT;
    let welcomeMessage = DENTAL_WELCOME;

    if (isDbAvailable && db) {
      try {
        const agentConfig = await db.agentConfig.findFirst();
        if (agentConfig) {
          agentName = agentConfig.name;
          model = agentConfig.model;
          voiceId = agentConfig.voiceId || 'nova';
          systemPrompt = agentConfig.systemPrompt;
          welcomeMessage = agentConfig.welcomeMessage || DENTAL_WELCOME;
        }
      } catch (e) {
        console.warn('Could not read agent config from DB, using defaults');
      }
    }

    const modelMap: Record<string, { provider: string; model: string }> = {
      'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
      'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
      'gpt-4.1': { provider: 'openai', model: 'gpt-4.1' },
      'gpt-4.1-mini': { provider: 'openai', model: 'gpt-4.1-mini' },
      'claude-3.5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet' },
    };

    const voiceMap: Record<string, { provider: string; voiceId: string }> = {
      'alloy': { provider: 'openai', voiceId: 'alloy' },
      'echo': { provider: 'openai', voiceId: 'echo' },
      'fable': { provider: 'openai', voiceId: 'fable' },
      'onyx': { provider: 'openai', voiceId: 'onyx' },
      'nova': { provider: 'openai', voiceId: 'nova' },
      'shimmer': { provider: 'openai', voiceId: 'shimmer' },
    };

    const modelConfig = modelMap[model] || modelMap['gpt-4o'];
    const voiceConfig = voiceMap[voiceId] || voiceMap['nova'];

    const assistantPayload = {
      name: agentName,
      model: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        systemPrompt: systemPrompt,
      },
      voice: {
        provider: voiceConfig.provider,
        voiceId: voiceConfig.voiceId,
      },
      firstMessage: welcomeMessage,
    };

    // Delete existing assistant if we have one
    const existingId = process.env.VAPI_ASSISTANT_ID;
    if (existingId) {
      try {
        await fetch(`https://api.vapi.ai/assistant/${existingId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${privateKey}` },
        });
      } catch (e) {
        // Ignore delete errors
      }
    }

    // Create the assistant
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assistantPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vapi API error:', errorText);
      return NextResponse.json(
        { error: `Vapi API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const assistant = await response.json();

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      assistantName: assistant.name,
    });
  } catch (error: any) {
    console.error('Error creating Vapi assistant:', error);
    return NextResponse.json({ error: error.message || 'Failed to create assistant' }, { status: 500 });
  }
}

// GET /api/vapi/assistant — Get config status
export async function GET() {
  try {
    const publicKey = process.env.VAPI_PUBLIC_KEY;
    const privateKey = process.env.VAPI_PRIVATE_KEY;
    const configured = !!(privateKey && publicKey);

    // Get agent config from DB or use defaults
    let agentName = 'Dental Receptionist';
    let model = 'gpt-4o';
    let voiceId = 'nova';
    let isActive = true;
    let assistantId = process.env.VAPI_ASSISTANT_ID || null;

    if (isDbAvailable && db) {
      try {
        const agentConfig = await db.agentConfig.findFirst();
        if (agentConfig) {
          agentName = agentConfig.name;
          model = agentConfig.model;
          voiceId = agentConfig.voiceId || 'nova';
          isActive = agentConfig.isActive;
          assistantId = agentConfig.transferNumber || assistantId;
        }
      } catch (e) {
        console.warn('Could not read agent config from DB, using defaults');
      }
    }

    return NextResponse.json({
      configured,
      hasAssistant: !!assistantId,
      assistantId,
      publicKey: publicKey || null,
      agentName,
      model,
      voice: voiceId,
      isActive,
    });
  } catch (error: any) {
    console.error('Error fetching Vapi config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
