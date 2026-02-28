// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/backend',
        'architecture/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'features/ai-pharmacist',
        'features/order-management',
        'features/prescription-handling',
        'features/inventory',
        'features/realtime-notifications',
        'features/payment-integration',
        'features/multilingual',
        'features/text-to-speech',
        'features/screen-recording',
        'features/agent-audit-logs',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: ['database/models'],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'development/getting-started',
        'development/tech-stack',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/environment-variables',
        'deployment/production',
      ],
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/authentication',
        'api/chat',
        'api/admin',
        'api/user',
        'api/payment',
        'api/prescription',
        'api/tts',
        'api/recording',
      ],
    },
  ],
};

export default sidebars;
