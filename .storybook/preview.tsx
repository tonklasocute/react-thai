import type { Preview } from '@storybook/react';
import '../src/styles/styles.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
  globalTypes: {
    theme: {
      description: 'Color scheme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => (
      <div data-theme={context.globals.theme} className="sb-surface">
        <Story />
      </div>
    ),
  ],
};

export default preview;
