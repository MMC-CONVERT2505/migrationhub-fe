import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePermissions } from '@/hooks/usePermissions';

const SettingsPage: React.FC = () => {
  const { can } = usePermissions();
  const items = [
    {
      to: '/admin/settings/migration-cleaner',
      title: 'Migration Cleaner',
      text: 'Soft delete (hide, restorable), hard delete or purge finished migrations. Every action is logged.',
      show: can('migration-cleaner.read'),
    },
  ].filter((i) => i.show);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary mb-6">Administration tools</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="block bg-white border border-border rounded-xl p-5 shadow-card hover:border-blue-300 transition-colors"
          >
            <h2 className="text-sm font-bold text-text-primary">{i.title}</h2>
            <p className="mt-1 text-xs text-text-secondary">{i.text}</p>
          </Link>
        ))}
        {items.length === 0 && <p className="text-sm text-text-secondary">Nothing here is available to your role.</p>}
      </div>
    </motion.div>
  );
};

export default SettingsPage;
