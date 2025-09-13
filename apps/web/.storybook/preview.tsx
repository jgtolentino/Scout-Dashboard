import type { Preview } from '@storybook/react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#F8F9FA',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
  },
}

export default preview