'use client';

import React from 'react';
import { MessageSquare, Database, Zap } from 'lucide-react';

type ChatMode = 'chat' | 'sql' | 'hybrid';

interface ChatModeSelectorProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

export function ChatModeSelector({ mode, onChange }: ChatModeSelectorProps) {
  const modes = [
    {
      value: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
      description: 'General Q&A'
    },
    {
      value: 'sql' as const,
      label: 'SQL',
      icon: Database,
      description: 'Data queries'
    },
    {
      value: 'hybrid' as const,
      label: 'Hybrid',
      icon: Zap,
      description: 'Chat + SQL'
    }
  ];
  
  return (
    <div className="flex gap-2">
      {modes.map((m) => {
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === m.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={m.description}
          >
            <Icon className="w-4 h-4" />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}