import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    emoji: '🤖',
    title: 'Multi-Agent AI Pharmacist',
    description:
      'Autonomous OpenAI Agents SDK orchestration with parent/child agent chain. Handles medicine queries, order placement, prescription validation, and refill automation in natural language.',
  },
  {
    emoji: '⚡',
    title: 'Real-Time Order Management',
    description:
      'Socket.IO-powered live updates. Admins dispatch orders and customers are notified instantly. Full order lifecycle from pending → paid → approved → dispatched.',
  },
  {
    emoji: '🌍',
    title: 'Multilingual Support',
    description:
      'Supports English, Hindi, and Marathi. User messages are auto-translated before reaching the AI and responses are translated back — all transparently.',
  },
  {
    emoji: '💊',
    title: 'Prescription OCR & Validation',
    description:
      'Upload prescription images via camera or file. AI extracts doctor, medicine, dosage, and duration. Admin reviews and approves before fulfilling prescription orders.',
  },
  {
    emoji: '📦',
    title: 'Smart Inventory System',
    description:
      'Real-time stock tracking, low-stock alerts via email/WhatsApp, automated refill reminders with node-cron scheduling, and full inventory audit logs.',
  },
  {
    emoji: '🔒',
    title: 'Secure & Auditable',
    description:
      'JWT auth, bcrypt hashing, Redis rate limiting, Razorpay webhook HMAC verification, and a full AgentAuditLog with prompt injection detection and token usage tracking.',
  },
];

function Feature({emoji, title, description}) {
  return (
    <div className={clsx('col col--4')} style={{marginBottom: '2rem'}}>
      <div className="text--center" style={{fontSize: '3rem', marginBottom: '0.5rem'}}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
