import { Box, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (range: { start: Date | null; end: Date | null }) => void
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={(newValue) => onChange({ start: newValue, end: endDate })}
        slotProps={{ textField: { size: 'small' } }}
      />
      <DatePicker
        label="End Date"
        value={endDate}
        onChange={(newValue) => onChange({ start: startDate, end: newValue })}
        minDate={startDate || undefined}
        slotProps={{ textField: { size: 'small' } }}
      />
    </Box>
  )
}