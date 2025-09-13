import type { Meta, StoryObj } from '@storybook/react'
import { ScoreCard } from './ScoreCard'

const meta = {
  title: 'UI/ScoreCard',
  component: ScoreCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    delta: {
      control: { type: 'number', min: -100, max: 100, step: 0.1 },
    },
  },
} satisfies Meta<typeof ScoreCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Brand Performance',
    value: '92%',
    delta: 4.2,
  },
}

export const Loading: Story = {
  args: {
    title: 'Revenue MTD',
    isLoading: true,
  },
}

export const Negative: Story = {
  args: {
    title: 'Market Share',
    value: '18.7%',
    delta: -2.3,
  },
}

export const NoChange: Story = {
  args: {
    title: 'Active Stores',
    value: '2,847',
    delta: 0,
  },
}

export const WithHint: Story = {
  args: {
    title: 'Customer Satisfaction',
    value: '92.3%',
    delta: 1.5,
    hint: 'Based on 1,234 survey responses this month',
  },
}

export const CurrencyValue: Story = {
  args: {
    title: 'Revenue MTD',
    value: '₱3.5M',
    delta: 12.5,
  },
}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4" style={{ width: '600px' }}>
      <ScoreCard title="Revenue MTD" value="₱3.5M" delta={12.5} />
      <ScoreCard title="Active Stores" value="2,847" delta={3.2} />
      <ScoreCard title="Market Share" value="18.7%" delta={-1.2} />
      <ScoreCard title="AI Insights" value="24" delta={0} />
    </div>
  ),
}