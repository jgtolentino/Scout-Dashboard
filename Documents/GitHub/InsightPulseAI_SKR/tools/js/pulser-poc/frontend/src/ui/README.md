# 🎨 Modular UI Component Library

This UI library provides theme-driven, reusable components that automatically adapt to design token changes.

## 🏗️ Architecture

```
theme.json (Design Tokens)
    ↓
tailwind.config.js (Token Integration)
    ↓
ui/ components (Token Consumers)
    ↓
Your App (Component Composition)
```

## 📦 Available Components

### Core Components
- **Button** - Primary action component with variants and sizes
- **Card** - Container with accent borders, headers, and footers
- **Badge** - Status indicators and labels
- **Input** - Form input with validation states
- **Select** - Dropdown selector with options

### Layout Components
- **Grid** - Responsive grid system
- **Panel** - Collapsible content sections
- **Divider** - Visual separators

### Utility Components
- **Title** - Typography component
- **Tooltip** - Contextual information on hover

## 🎨 Design Tokens

All components use tokens from `theme.json`:

```json
{
  "colors": {
    "primary": "#1F4E79",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "danger": "#EF4444"
  },
  "spacing": {
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem"
  }
}
```

## 💡 Usage Examples

### Button
```tsx
import { Button } from '@/ui';

<Button variant="primary" size="md">
  Save Changes
</Button>

<Button variant="danger" loading>
  Deleting...
</Button>
```

### Card
```tsx
import { Card } from '@/ui';

<Card 
  title="Revenue" 
  accent="success"
  headerActions={<Button size="sm">View</Button>}
>
  <p>₱1,234,567</p>
</Card>
```

### Grid
```tsx
import { Grid, Card } from '@/ui';

<Grid cols={3} gap="lg" responsive={{ sm: 1, md: 2, lg: 3 }}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

## 🔧 Token Mapping

| Component Property | Token Used | Example |
|-------------------|------------|---------|
| `variant="primary"` | `colors.primary` | `#1F4E79` |
| `size="md"` | `spacing.md` | `1rem` |
| `shadow="card"` | `shadows.card` | `0 1px 3px...` |
| `rounded="lg"` | `radii.lg` | `0.5rem` |

## 📈 Extending the Library

### Adding a New Component
1. Create component in `ui/NewComponent.tsx`
2. Use Tailwind classes that reference tokens
3. Export from `ui/index.ts`
4. Document in this README

### Adding a New Token
1. Add to `theme.json`
2. Run build to update Tailwind
3. Use in components via Tailwind classes

### Example: New Color
```json
// theme.json
{
  "colors": {
    "accent": "#F2C14E"
  }
}
```

```tsx
// Component usage
<div className="bg-accent text-white">
  New accent color!
</div>
```

## 🚀 Best Practices

1. **Always use tokens** - Never hardcode colors or spacing
2. **Compose, don't duplicate** - Use existing components
3. **Document variants** - Add new props to TypeScript interfaces
4. **Test responsiveness** - Use Grid's responsive props
5. **Maintain consistency** - Follow existing patterns

## 🔄 Theme Updates

When `theme.json` changes:
1. Tailwind automatically picks up new tokens
2. Components update without code changes
3. CSS variables are generated for runtime theming

## 📱 Responsive Design

All components support responsive variants:
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`
- Grid system adapts automatically

## ♿ Accessibility

Components include:
- ARIA labels
- Keyboard navigation
- Focus states
- Screen reader support

---

**Remember**: One theme file to rule them all! 🎨