import React, { type FC, type ReactNode } from 'react';
import {
  Users,
  Box,
  BarChart,
  Clock,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Undo2,
  Receipt,
  CircleDot,
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  accent?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const StatCard = ({ label, value, accent = 'from-cardinal to-brick', icon: Icon }: StatCardProps) => (
  <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur">
    <div className="mb-4 flex items-center justify-between">
      <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${accent}`} />
      {Icon ? <span aria-hidden="true" className="text-lg leading-none">{React.createElement(Icon, { className: "w-5 h-5" })}</span> : null}
    </div>
    <p className="text-sm uppercase tracking-[0.2em] text-stone-500">{label}</p>
    <p className="mt-3 text-4xl font-semibold text-ink">{value}</p>
  </div>
);

export default StatCard;
