import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Avatar,
} from '@mui/material'
import { format } from 'date-fns'

// Mock data - replace with real data
const transactions = [
  {
    id: '1',
    storeName: 'Juan Store',
    amount: 2450,
    products: 12,
    timestamp: new Date(),
    status: 'completed',
  },
  {
    id: '2',
    storeName: 'Maria Sari-Sari',
    amount: 1890,
    products: 8,
    timestamp: new Date(Date.now() - 3600000),
    status: 'processing',
  },
  {
    id: '3',
    storeName: 'Pedro Corner Store',
    amount: 3200,
    products: 15,
    timestamp: new Date(Date.now() - 7200000),
    status: 'completed',
  },
  {
    id: '4',
    storeName: 'Ana Mini Mart',
    amount: 980,
    products: 5,
    timestamp: new Date(Date.now() - 10800000),
    status: 'failed',
  },
  {
    id: '5',
    storeName: 'Carlos Shop',
    amount: 4500,
    products: 20,
    timestamp: new Date(Date.now() - 14400000),
    status: 'completed',
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
}

export function RecentTransactions() {
  return (
    <TableContainer sx={{ height: '100%', overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Store</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="center">Products</TableCell>
            <TableCell>Time</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {transaction.storeName[0]}
                  </Avatar>
                  {transaction.storeName}
                </Box>
              </TableCell>
              <TableCell align="right">₱{transaction.amount.toLocaleString()}</TableCell>
              <TableCell align="center">{transaction.products}</TableCell>
              <TableCell>{format(transaction.timestamp, 'HH:mm')}</TableCell>
              <TableCell align="center">
                <Chip
                  label={transaction.status}
                  color={getStatusColor(transaction.status)}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}