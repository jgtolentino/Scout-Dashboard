import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton, Divider, Toolbar, Box } from '@mui/material'
import { Dashboard, TrendingUp, Business, Inventory, Category, Psychology, Settings } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarProps {
  open: boolean
  onClose: () => void
  drawerWidth: number
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Sales Analytics', icon: <TrendingUp />, path: '/sales' },
  { text: 'Brand Performance', icon: <Business />, path: '/brands' },
  { text: 'Store Metrics', icon: <Category />, path: '/stores' },
  { text: 'Product Insights', icon: <Inventory />, path: '/products' },
  { text: 'AI Insights', icon: <Psychology />, path: '/ai-insights' },
]

export function Sidebar({ open, onClose, drawerWidth }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  const drawer = (
    <Box>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/settings'}
            onClick={() => handleNavigation('/settings')}
          >
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  )
}