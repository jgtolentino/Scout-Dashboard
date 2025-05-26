import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Total Sales',
    value: '$124,320',
    icon: TrendingUpIcon,
    change: 12.5,
    subtitle: 'vs last month'
  }

  it('renders with all props correctly', () => {
    render(<MetricCard {...defaultProps} />)
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('$124,320')).toBeInTheDocument()
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('displays positive change with green color and up icon', () => {
    render(<MetricCard {...defaultProps} />)
    
    const changeElement = screen.getByText('+12.5%')
    expect(changeElement).toHaveStyle({ color: 'rgb(46, 125, 50)' })
    
    const trendIcon = screen.getByTestId('TrendingUpIcon')
    expect(trendIcon).toBeInTheDocument()
  })

  it('displays negative change with red color and down icon', () => {
    render(<MetricCard {...defaultProps} change={-8.3} />)
    
    const changeElement = screen.getByText('-8.3%')
    expect(changeElement).toHaveStyle({ color: 'rgb(211, 47, 47)' })
    
    const trendIcon = screen.getByTestId('TrendingDownIcon')
    expect(trendIcon).toBeInTheDocument()
  })

  it('renders without change when change prop is not provided', () => {
    const { change, ...propsWithoutChange } = defaultProps
    render(<MetricCard {...propsWithoutChange} />)
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('$124,320')).toBeInTheDocument()
    expect(screen.queryByText(/[+-]\d+\.?\d*%/)).not.toBeInTheDocument()
  })

  it('renders with custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>
    render(<MetricCard {...defaultProps} icon={CustomIcon} />)
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('handles zero change correctly', () => {
    render(<MetricCard {...defaultProps} change={0} />)
    
    const changeElement = screen.getByText('0%')
    expect(changeElement).toHaveStyle({ color: 'rgb(117, 117, 117)' })
  })
})