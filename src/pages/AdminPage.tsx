import React from 'react';
import { motion } from 'framer-motion';
import { KPICards } from '@/components/admin/KPICards';
import { MigrationTable } from '@/components/admin/MigrationTable';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BarChart, DonutChart } from '@/components/admin/Charts';

const AdminDashboard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Real-time overview of all migration activity · Last updated just now
      </p>
    </div>

    <KPICards />

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 mb-5">
      <MigrationTable />
      <ActivityFeed />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <BarChart />
      <DonutChart />
    </div>
  </motion.div>
);

export default AdminDashboard;
