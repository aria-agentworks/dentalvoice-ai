import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/vapi/assistant — Create a Vapi assistant from our DB config
export async function POST() {
  try {
    const privateKey = process.env.VAPI_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Vapi private key not configured' }, { status: 500 });
    }

    const agentConfig = await db.agentConfig.findFirst();
    if (!agentConfig) {
      return NextResponse.json({ error: 'Agent config not found' }, { status: 404 });
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

    const modelConfig = modelMap[agentConfig.model] || modelMap['gpt-4o'];
    const voiceConfig = voiceMap[agentConfig.voiceId || 'nova'] || voiceMap['nova'];

    const assistantPayload = {
      name: agentConfig.name,
      model: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        systemPrompt: agentConfig.systemPrompt,
      },
      voice: {
        provider: voiceConfig.provider,
        voiceId: voiceConfig.voiceId,
      },
      firstMessage: agentConfig.welcomeMessage || "Good morning! Thank you for calling. How can I help you today?",
    };

    // If we already have an assistant, delete it first to avoid duplicates
    // We store the Vapi assistant ID in a separate mechanism
    const existingId = process.env.VAPI_ASSISTANT_ID;
    if (existingId) {
      try {
        await fetch(`https://api.vapi.ai/assistant/${existingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${privateKey}`,
          },
        });
      } catch (e) {
        // Ignore delete errors (assistant might not exist)
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

    // Update the env-like config in DB to store the assistant ID
    // We'll use the transferNumber field to store the Vapi assistant ID
    await db.agentConfig.update({
      where: { id: agentConfig.id },
      data: {
        transferNumber: assistant.id,
      },
    });

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
    const agentConfig = await db.agentConfig.findFirst();
    if (!agentConfig) {
      return NextResponse.json({ error: 'Agent config not found' }, { status: 404 });
    }

    const publicKey = process.env.VAPI_PUBLIC_KEY;
    const privateKey = process.env.VAPI_PRIVATE_KEY;

    // The Vapi assistant ID is stored in transferNumber field
    const vapiAssistantId = agentConfig.transferNumber;

    return NextResponse.json({
      configured: !!(privateKey && publicKey),
      hasAssistant: !!vapiAssistantId,
      assistantId: vapiAssistantId,
      publicKey: publicKey || null,
      agentName: agentConfig.name,
      model: agentConfig.model,
      voice: agentConfig.voiceId,
      isActive: agentConfig.isActive,
    });
  } catch (error: any) {
    console.error('Error fetching Vapi config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
