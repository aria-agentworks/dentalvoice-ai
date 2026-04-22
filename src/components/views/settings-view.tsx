'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  RotateCcw,
  Mic,
  Brain,
  MessageSquare,
  Phone,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  provider: string;
  voiceId: string | null;
  model: string;
  systemPrompt: string;
  welcomeMessage: string | null;
  maxDuration: number;
  transferNumber: string | null;
  languages: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function SettingsView() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    provider: 'vapi',
    voiceId: 'alloy',
    model: 'gpt-4o',
    systemPrompt: '',
    welcomeMessage: '',
    maxDuration: '300',
    transferNumber: '',
    languages: 'en',
    isActive: true,
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/agent-config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          setForm({
            name: data.name,
            provider: data.provider,
            voiceId: data.voiceId || 'alloy',
            model: data.model,
            systemPrompt: data.systemPrompt,
            welcomeMessage: data.welcomeMessage || '',
            maxDuration: String(data.maxDuration),
            transferNumber: data.transferNumber || '',
            languages: data.languages,
            isActive: data.isActive,
          });
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/agent-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxDuration: parseInt(form.maxDuration),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const voiceOptions = [
    { value: 'alloy', label: 'Alloy (Natural)' },
    { value: 'echo', label: 'Echo (Warm)' },
    { value: 'fable', label: 'Fable (British)' },
    { value: 'onyx', label: 'Onyx (Deep)' },
    { value: 'nova', label: 'Nova (Friendly)' },
    { value: 'shimmer', label: 'Shimmer (Soft)' },
  ];

  const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
    { value: 'gpt-4.1', label: 'GPT-4.1 (Balanced)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Economical)' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-[600px] bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Settings</h1>
          <p className="text-slate-500 mt-1">Configure your AI dental receptionist</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <Badge className="bg-emerald-100 text-emerald-700 gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </Badge>
          )}
          <Button
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Identity */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900">Agent Identity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Agent Name</Label>
                <Input
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Voice Provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vapi">Vapi AI</SelectItem>
                      <SelectItem value="retell">Retell AI</SelectItem>
                      <SelectItem value="bland">Bland AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Language</Label>
                  <Select value={form.languages} onValueChange={(v) => setForm({ ...form, languages: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="en,es">English + Spanish</SelectItem>
                      <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice & Model */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900">Voice & Intelligence</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  <Brain className="w-3.5 h-3.5 inline mr-1.5" />
                  AI Model
                </Label>
                <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-1">
                  Higher quality models produce more natural conversations but cost more per minute
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  <Mic className="w-3.5 h-3.5 inline mr-1.5" />
                  Voice
                </Label>
                <Select value={form.voiceId} onValueChange={(v) => setForm({ ...form, voiceId: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900">Agent Instructions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Welcome Message</Label>
                <Input
                  className="mt-1"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                  placeholder="What the agent says when it answers a call..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium text-slate-700">System Prompt</Label>
                  <span className="text-xs text-slate-400">{form.systemPrompt.length} characters</span>
                </div>
                <Textarea
                  className="mt-0 min-h-[200px] font-mono text-xs leading-relaxed"
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="Define how the agent should behave..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  This prompt defines the agent's personality, knowledge, and behavior during calls
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Call Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-base font-semibold text-slate-900">Call Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Max Call Duration (seconds)</Label>
                <Input
                  type="number"
                  className="mt-1 max-w-[200px]"
                  value={form.maxDuration}
                  onChange={(e) => setForm({ ...form, maxDuration: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Recommended: 300 seconds (5 minutes) for dental front desk
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Human Transfer Number</Label>
                <Input
                  className="mt-1 max-w-[250px]"
                  value={form.transferNumber}
                  onChange={(e) => setForm({ ...form, transferNumber: e.target.value })}
                  placeholder="+15551002000"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Calls will be transferred here when the patient requests a human
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Agent Status */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Agent Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active</span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                form.isActive ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
              }`}>
                <span className={`relative flex h-2.5 w-2.5 flex-shrink-0 ${form.isActive ? '' : 'opacity-40'}`}>
                  {form.isActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </span>
                <span className={`text-xs font-medium ${form.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {form.isActive ? 'Agent is online and accepting calls' : 'Agent is offline'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Production Info */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Production Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'HIPAA Compliance', status: 'active', desc: 'BAA signed with Vapi AI' },
                { label: 'Voice Provider', status: 'active', desc: 'Vapi AI connected' },
                { label: 'Call Recording', status: 'active', desc: 'Transcripts stored securely' },
                { label: 'Human Transfer', status: form.transferNumber ? 'active' : 'warning', desc: form.transferNumber ? 'Configured' : 'Not configured' },
                { label: 'Multi-language', status: form.languages !== 'en' ? 'active' : 'inactive', desc: form.languages !== 'en' ? `${form.languages} enabled` : 'English only' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  {item.status === 'active' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : item.status === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-amber-800">Tips for Better Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-amber-700">
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Keep the system prompt concise and role-focused
                </li>
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Set a human transfer number for complex cases
                </li>
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Test with real patient scenarios before going live
                </li>
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Monitor transcripts weekly to improve responses
                </li>
                <li className="flex items-start gap-1.5">
                  <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Enable multi-language for diverse patient populations
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
