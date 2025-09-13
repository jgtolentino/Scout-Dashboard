'use client';

import { useState } from 'react';
import { ChartBarIcon, SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export type Domain = 'auto' | 'scout' | 'ces' | 'docs';

interface DomainOption {
  id: Domain;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  examples: string[];
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    id: 'auto',
    name: 'Auto-Detect',
    description: 'Automatically route to the best domain',
    icon: SparklesIcon,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    examples: [
      'What were our top selling products last month?',
      'How effective was our latest campaign?',
      'How do I integrate the Scout API?'
    ]
  },
  {
    id: 'scout',
    name: 'Scout (Retail)',
    description: 'Retail analytics, sales data, customer insights',
    icon: ChartBarIcon,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    examples: [
      'Show sales performance by region',
      'What are customer shopping patterns?',
      'Compare brand performance metrics'
    ]
  },
  {
    id: 'ces',
    name: 'CES (Creative)',
    description: 'Creative effectiveness, campaign performance',
    icon: SparklesIcon,
    color: 'text-green-600 bg-green-50 border-green-200',
    examples: [
      'Analyze campaign ROI by creative',
      'What drives creative effectiveness?',
      'Compare ad performance metrics'
    ]
  },
  {
    id: 'docs',
    name: 'Documentation',
    description: 'API docs, tutorials, integration guides',
    icon: DocumentTextIcon,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    examples: [
      'How to set up Scout authentication?',
      'API endpoints for campaign data',
      'Step-by-step integration guide'
    ]
  }
];

interface DomainSelectorProps {
  selectedDomain?: Domain;
  onDomainChange?: (domain: Domain) => void;
}

export function DomainSelector({ selectedDomain = 'auto', onDomainChange }: DomainSelectorProps) {
  const [selected, setSelected] = useState<Domain>(selectedDomain);
  const [showExamples, setShowExamples] = useState(false);

  const handleDomainChange = (domain: Domain) => {
    setSelected(domain);
    onDomainChange?.(domain);
  };

  const selectedOption = DOMAIN_OPTIONS.find(option => option.id === selected) || DOMAIN_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DOMAIN_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => handleDomainChange(option.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
                transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? option.color + ' shadow-md' 
                  : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{option.name}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <selectedOption.icon className={`w-5 h-5 mt-0.5 ${selectedOption.color.split(' ')[0]}`} />
          <div>
            <h4 className="font-medium text-gray-900">{selectedOption.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{selectedOption.description}</p>
            
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              {showExamples ? 'Hide' : 'Show'} example queries
            </button>

            {showExamples && (
              <div className="mt-3 space-y-2">
                {selectedOption.examples.map((example, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-white rounded p-2 border">
                    "{example}"
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}