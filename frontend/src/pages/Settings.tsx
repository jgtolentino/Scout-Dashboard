import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function Settings() {
  const [tab, setTab] = useState(0)
  const [saved, setSaved] = useState(false)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Notifications" />
          <Tab label="Data & Privacy" />
          <Tab label="API Keys" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <TextField label="Dashboard Name" defaultValue="Scout Dashboard" fullWidth />
            <TextField label="Time Zone" defaultValue="Asia/Manila" fullWidth />
            <TextField
              label="Default Date Range"
              select
              defaultValue="30"
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </TextField>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-refresh dashboard"
            />
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Email notifications"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Low stock alerts"
            />
            <FormControlLabel
              control={<Switch />}
              label="Daily summary reports"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Anomaly detection alerts"
            />
            <Divider />
            <TextField
              label="Notification Email"
              type="email"
              defaultValue="admin@scout.com"
              fullWidth
            />
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            Data & Privacy Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable data encryption"
            />
            <FormControlLabel
              control={<Switch />}
              label="Anonymous usage statistics"
            />
            <TextField
              label="Data Retention Period"
              select
              defaultValue="365"
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="730">2 years</option>
            </TextField>
            <Divider />
            <Button variant="outlined" color="error">
              Clear Cache
            </Button>
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Typography variant="h6" gutterBottom>
            API Configuration
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Keep your API keys secure. Never share them publicly.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
            <TextField
              label="Azure SQL Connection String"
              type="password"
              fullWidth
              helperText="Your Azure SQL database connection string"
            />
            <TextField
              label="Azure Functions Key"
              type="password"
              fullWidth
              helperText="API key for Azure Functions"
            />
            <TextField
              label="Azure AD Client ID"
              fullWidth
              helperText="For authentication"
            />
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  )
}