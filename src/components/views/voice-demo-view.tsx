'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Zap,
  MessageSquare,
  User,
  Bot,
  ArrowRight,
  Info,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type CallStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'ended';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface VapiConfig {
  configured: boolean;
  hasAssistant: boolean;
  assistantId: string | null;
  publicKey: string | null;
  agentName: string;
  model: string;
  voice: string;
  isActive: boolean;
}

export function VoiceDemoView() {
  const [config, setConfig] = useState<VapiConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [creatingAssistant, setCreatingAssistant] = useState(false);

  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Vapi config from server
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/vapi/assistant');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Failed to fetch Vapi config:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateAssistant = async () => {
    setCreatingAssistant(true);
    try {
      const res = await fetch('/api/vapi/assistant', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Assistant "${data.assistantName}" created!`);
        await fetchConfig();
      } else {
        toast.error(data.error || 'Failed to create assistant');
      }
    } catch (err) {
      toast.error('Failed to create assistant');
    } finally {
      setCreatingAssistant(false);
    }
  };

  const startCall = useCallback(async () => {
    if (!config?.publicKey || !config?.assistantId) {
      setError('Vapi not configured. Ask your admin to set up the API keys.');
      return;
    }

    setError(null);
    setCallStatus('connecting');
    setTranscript([]);
    setCallDuration(0);

    try {
      const Vapi = (await import('@vapi-ai/web')).default;
      const vapi = new Vapi(config.publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setCallStatus('connected');
        timerRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      });

      vapi.on('speech-start', () => {
        setIsSpeaking(true);
        setCallStatus('speaking');
      });

      vapi.on('speech-end', () => {
        setIsSpeaking(false);
        setCallStatus('connected');
      });

      vapi.on('transcript', (transcriptEvent: any) => {
        if (transcriptEvent.role === 'user') {
          setTranscript((prev) => [
            ...prev,
            { role: 'user', text: transcriptEvent.transcript, timestamp: new Date() },
          ]);
          setCallStatus('listening');
        } else if (transcriptEvent.role === 'assistant') {
          setTranscript((prev) => [
            ...prev,
            { role: 'assistant', text: transcriptEvent.transcript, timestamp: new Date() },
          ]);
          setCallStatus('speaking');
        }
      });

      vapi.on('call-end', () => {
        setCallStatus('ended');
        setIsSpeaking(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      });

      vapi.on('error', (e: any) => {
        console.error('Vapi error:', e);
        setError(e.message || 'An error occurred during the call');
        setCallStatus('idle');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      });

      // Start call with the pre-created assistant ID
      await vapi.start(config.assistantId);

    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(err.message || 'Failed to initialize voice agent');
      setCallStatus('idle');
    }
  }, [config]);

  const endCall = useCallback(async () => {
    if (vapiRef.current) {
      try { await vapiRef.current.stop(); } catch (e) { /* ignore */ }
      vapiRef.current = null;
    }
    setCallStatus('ended');
    setIsSpeaking(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      if (isMuted) { vapiRef.current.unmute(); } else { vapiRef.current.mute(); }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleVolume = useCallback(() => {
    if (vapiRef.current) {
      if (isVolumeOn) { vapiRef.current.setVolume(0); } else { vapiRef.current.setVolume(1); }
      setIsVolumeOn(!isVolumeOn);
    }
  }, [isVolumeOn]);

  const statusConfig: Record<CallStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
    idle: { label: 'Ready', color: 'text-slate-500', icon: <Phone className="w-4 h-4" />, bgColor: 'bg-slate-50' },
    connecting: { label: 'Connecting...', color: 'text-amber-600', icon: <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />, bgColor: 'bg-amber-50' },
    connected: { label: 'Connected', color: 'text-emerald-600', icon: <CheckCircle2 className="w-4 h-4" />, bgColor: 'bg-emerald-50' },
    speaking: { label: 'Agent Speaking', color: 'text-teal-600', icon: <Volume2 className="w-4 h-4" />, bgColor: 'bg-teal-50' },
    listening: { label: 'Listening...', color: 'text-blue-600', icon: <Mic className="w-4 h-4" />, bgColor: 'bg-blue-50' },
    ended: { label: 'Call Ended', color: 'text-slate-500', icon: <PhoneOff className="w-4 h-4" />, bgColor: 'bg-slate-50' },
  };

  const currentStatus = statusConfig[callStatus];

  if (configLoading) {
    return (
      <div className="space-y-6">
        <div><div className="h-8 w-48 bg-slate-200 rounded animate-pulse" /></div>
        <div className="h-[500px] bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Voice Demo</h1>
          <p className="text-slate-500 mt-1">Test the AI voice agent with a live call from your browser</p>
        </div>
        <div className="flex items-center gap-2">
          {config?.hasAssistant && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 text-xs font-medium px-3 py-1">
              <CheckCircle2 className="w-3 h-3" />
              {config.agentName}
            </Badge>
          )}
          {callStatus !== 'idle' && callStatus !== 'ended' && (
            <Badge className={`text-sm px-3 py-1 ${currentStatus.bgColor} ${currentStatus.color} border gap-2 font-medium`}>
              {currentStatus.icon}
              {currentStatus.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Call Panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Not Configured */}
          {!config?.configured && (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Vapi Not Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-amber-800">Your Vapi API keys haven&apos;t been configured yet. Ask your administrator to add the keys to the server environment.</p>
                <div className="bg-white/60 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-amber-700 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Get your keys from <strong>dashboard.vapi.ai</strong> → Settings → API Keys. Free $10 credit on signup.</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configured but no assistant */}
          {config?.configured && !config?.hasAssistant && (
            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Create Your Voice Assistant</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Vapi keys are connected. Click below to create the AI receptionist on Vapi&apos;s servers using your configured settings.
                  </p>
                </div>
                <Button
                  className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={handleCreateAssistant}
                  disabled={creatingAssistant}
                >
                  {creatingAssistant ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Voice Assistant
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assistant Ready */}
          {config?.configured && config?.hasAssistant && (
            <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800">Ready to Call</p>
                    <p className="text-xs text-emerald-600">
                      {config.agentName} · {config.model} · {config.voice} voice
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 gap-1.5"
                    onClick={handleCreateAssistant}
                    disabled={creatingAssistant}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${creatingAssistant ? 'animate-spin' : ''}`} />
                    Rebuild
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Call Interface */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Call Header */}
            <div className={`p-6 text-center ${callStatus === 'connected' || callStatus === 'speaking' || callStatus === 'listening'
              ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
              : callStatus === 'connecting'
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
              : 'bg-slate-50 text-slate-500'
            }`}>
              {callStatus === 'idle' || callStatus === 'ended' ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-slate-200 flex items-center justify-center mx-auto mb-4">
                    <PhoneCall className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {callStatus === 'ended' ? 'Demo Complete' : 'Ready to Demo'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {callStatus === 'ended'
                      ? `Call lasted ${formatDuration(callDuration)}`
                      : 'Click the button below to start a live voice call'
                    }
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          isSpeaking ? 'bg-white animate-pulse' : callStatus === 'listening' ? 'bg-white/60' : 'bg-white/40'
                        }`}
                        style={{
                          height: isSpeaking ? `${12 + Math.random() * 24}px` : '8px',
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    <span className="text-sm font-medium">
                      {callStatus === 'connecting' ? 'Connecting to voice agent...' :
                       callStatus === 'speaking' ? 'Agent is speaking...' :
                       callStatus === 'listening' ? 'Listening to you...' :
                       'Live Call'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-white/80">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Call Controls */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex items-center justify-center gap-4">
                {(callStatus === 'connected' || callStatus === 'speaking' || callStatus === 'listening') && (
                  <>
                    <Button variant="outline" size="lg" className={`rounded-full w-14 h-14 p-0 ${isMuted ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-slate-200 hover:bg-slate-50'}`} onClick={toggleMute}>
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button variant="outline" size="lg" className={`rounded-full w-14 h-14 p-0 ${!isVolumeOn ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-slate-200 hover:bg-slate-50'}`} onClick={toggleVolume}>
                      {isVolumeOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                  </>
                )}

                {callStatus === 'idle' || callStatus === 'ended' ? (
                  <Button size="lg" className="rounded-full w-16 h-16 p-0 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25" onClick={startCall} disabled={!config?.hasAssistant}>
                    <Phone className="w-6 h-6" />
                  </Button>
                ) : callStatus === 'connecting' ? (
                  <Button size="lg" className="rounded-full w-16 h-16 p-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/25" disabled>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </Button>
                ) : (
                  <Button size="lg" className="rounded-full w-16 h-16 p-0 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25" onClick={endCall}>
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                )}

                {(callStatus === 'connected' || callStatus === 'speaking' || callStatus === 'listening') && (
                  <><div className="w-14 h-14" /><div className="w-14 h-14" /></>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Connection Error</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Live Transcript */}
            <div className="border-t border-slate-100">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Live Transcript</span>
                </div>
                {transcript.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-600">{transcript.length} messages</Badge>
                )}
              </div>
              <div ref={scrollRef} className="max-h-[350px] overflow-y-auto p-4 space-y-3">
                {transcript.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                    <p className="text-sm text-slate-400">
                      {callStatus === 'idle' ? 'Start a call to see the live transcript' : 'Waiting for conversation...'}
                    </p>
                  </div>
                ) : (
                  transcript.map((entry, i) => (
                    <div key={i} className={`flex items-start gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.role === 'assistant' ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {entry.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className={`max-w-[80%] ${entry.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          entry.role === 'assistant' ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-teal-600 text-white rounded-tr-sm'
                        }`}>
                          {entry.text}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 px-1">
                          {entry.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* What Happens */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" />
                <CardTitle className="text-base font-semibold text-slate-900">What Happens</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: '1', text: 'Agent answers the call with a warm greeting' },
                { step: '2', text: 'Speak naturally — the agent listens and responds' },
                { step: '3', text: 'Try asking to schedule a cleaning or checkup' },
                { step: '4', text: 'Ask about insurance, hours, or services' },
                { step: '5', text: 'See the real-time transcript appear below' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Demo Scenarios */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Try These Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { emoji: '🦷', text: 'I want to schedule a cleaning', hot: true },
                { emoji: '🕐', text: 'What are your office hours?', hot: false },
                { emoji: '🏥', text: 'Do you accept Delta Dental?', hot: false },
                { emoji: '💰', text: 'How much is teeth whitening?', hot: false },
                { emoji: '🚨', text: 'I have a terrible toothache', hot: true },
                { emoji: '📍', text: 'Where are you located?', hot: false },
                { emoji: '📱', text: 'Can I reschedule my appointment?', hot: false },
              ].map((scenario) => (
                <div key={scenario.text} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-default">
                  <span className="text-base flex-shrink-0">{scenario.emoji}</span>
                  <span className="text-sm text-slate-600">&ldquo;{scenario.text}&rdquo;</span>
                  {scenario.hot && <Badge className="text-[9px] px-1.5 py-0 bg-red-50 text-red-600 border-red-100 ml-auto">HOT</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Outbound */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900">Outbound Call</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">Optionally enter a phone number to call. Leave empty for an in-browser voice demo.</p>
              <Input placeholder="+1 (555) 123-4567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="text-sm" />
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-teal-200 bg-teal-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-500" />
                <CardTitle className="text-base font-semibold text-teal-800">Demo Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-teal-700">
                <li className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />Speak clearly and naturally for best results</li>
                <li className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />Allow microphone access when prompted by browser</li>
                <li className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />Try the hot scenarios for impressive demos</li>
                <li className="flex items-start gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />Watch the transcript panel to show real-time AI understanding</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
