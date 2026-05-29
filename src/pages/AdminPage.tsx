import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { KPICards } from '@/components/admin/KPICards';
import { MigrationTable } from '@/components/admin/MigrationTable';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BarChart, DonutChart } from '@/components/admin/Charts';

const AdminPage: React.FC = () => (
  <div className="min-h-screen bg-bg animate-screen-enter">
    <Navbar variant="admin" />

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Real-time overview of all migration activity across all platform pairs · Last updated just now
        </p>
      </motion.div>

      {/* KPI Row */}
      <KPICards />

      {/* Main grid: table + feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 mb-5">
        <MigrationTable />
        <ActivityFeed />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarChart />
        <DonutChart />
      </div>
    </main>
  </div>
);

export default AdminPage;
