import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'KOS Design System',
  description: 'Neo-brutalist industrial UI component library for Svelte 5',
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Components', link: '/components/button' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Button', link: '/components/button' },
          { text: 'Card', link: '/components/card' },
          { text: 'Badge', link: '/components/badge' },
          { text: 'Input', link: '/components/input' },
          { text: 'Toggle', link: '/components/toggle' },
          { text: 'Tabs', link: '/components/tabs' },
          { text: 'Modal', link: '/components/modal' },
          { text: 'Dropdown', link: '/components/dropdown' },
          { text: 'Accordion', link: '/components/accordion' },
          { text: 'Avatar', link: '/components/avatar' },
          { text: 'Select', link: '/components/select' },
          { text: 'Checkbox', link: '/components/checkbox' },
          { text: 'RadioGroup', link: '/components/radio-group' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/stephen-netu/kos-design-system' },
    ],
  },
});
