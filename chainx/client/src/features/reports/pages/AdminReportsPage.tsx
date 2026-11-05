import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingBag,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Gift,
  RotateCcw,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import api from '@/lib/axios';

interface ReportCard {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const REPORT_TYPES: ReportCard[] = [
  {
    id: 'users',
    name: 'Users Export',
    description: 'All registered platform accounts, contact details, account status, and registration payment status.',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    id: 'orders',
    name: 'Product Orders',
    description: 'E-commerce product purchases, unit amounts, quantities, customer details, and fulfillment statuses.',
    icon: ShoppingBag,
    color: 'text-purple-400',
  },
  {
    id: 'registration-payments',
    name: 'Registration Fees',
    description: 'Full record of initial platform entry fee submissions, Easypaisa/JazzCash references, and verification logs.',
    icon: CreditCard,
    color: 'text-emerald-400',
  },
  {
    id: 'deposits',
    name: 'Deposit History',
    description: 'Manual deposit slips and automated gateway inflows credited into user wallets.',
    icon: ArrowDownCircle,
    color: 'text-cyan-400',
  },
  {
    id: 'withdrawals',
    name: 'Withdrawal History',
    description: 'User payout requests, bank/mobile wallet account details, approval timestamps, and gateway transaction IDs.',
    icon: ArrowUpCircle,
    color: 'text-amber-400',
  },
  {
    id: 'commissions',
    name: 'Referral Commissions',
    description: 'Individual direct referral bonuses (Rs. 1,500) credited per qualifying active member.',
    icon: DollarSign,
    color: 'text-rose-400',
  },
  {
    id: 'bonuses',
    name: 'Milestone Bonuses',
    description: '10-referral milestone performance rewards (Rs. 15,000) credited to qualifying leaders.',
    icon: Gift,
    color: 'text-indigo-400',
  },
  {
    id: 'refunds',
    name: 'Fee Refund Claims',
    description: '100% registration fee refunds requested and disbursed upon reaching the 10-referral milestone.',
    icon: RotateCcw,
    color: 'text-teal-400',
  },
  {
    id: 'tasks',
    name: 'Task Rewards',
    description: 'Member task submission proofs and rewards approved across all active categories.',
    icon: CheckSquare,
    color: 'text-sky-400',
  },
  {
    id: 'ledger',
    name: 'Financial Ledger Journal',
    description: 'Double-entry wallet transaction journal with immutable opening balances, closing balances, and idempotency keys.',
    icon: BookOpen,
    color: 'text-amber-300',
  },
];

export default function AdminReportsPage(): React.ReactElement {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (type: string) => {
    try {
      setDownloadingId(type);
      setError(null);

      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/admin/reports/${type}`, {
        params,
        responseType: 'blob',
      });

      // Trigger browser download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to download ${type} report.`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Financial &amp; Platform Reports</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate and export official CSV reports for audits, accounting, compliance, and platform metrics.
          </p>
        </div>

        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs self-start md:self-auto">
          CSV Stream Ready
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Date Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span>Filter Report Date Range (Optional):</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-slate-200 h-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-slate-200 h-8"
            />
          </div>

          {(startDate || endDate) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="h-8 text-xs text-slate-400 hover:text-white"
            >
              Reset Dates
            </Button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((rep) => {
          const Icon = rep.icon;
          const isDownloading = downloadingId === rep.id;
          return (
            <div
              key={rep.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      <Icon className={`h-4 w-4 ${rep.color}`} />
                    </div>
                    <h3 className="text-sm font-bold text-white">{rep.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">.CSV</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{rep.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {startDate || endDate ? 'Filtered Range' : 'All-time stream'}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleDownload(rep.id)}
                  disabled={isDownloading}
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  <Download className={`h-3.5 w-3.5 mr-1.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? 'Generating...' : 'Download CSV'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
