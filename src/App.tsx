import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoanApp } from './apps/loan-application/LoanApp';
import { CustomerSupportApp } from './apps/customer-support/CustomerSupportApp';
import { useTheme } from './hooks/useTheme';
import './App.css';

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-zinc-800 dark:text-zinc-100 relative">
      {/* Subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-100/30 dark:bg-amber-900/5 rounded-full blur-3xl" />
      </div>
      <Header theme={theme} onToggleTheme={toggle} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loan-application" element={<LoanApp />} />
        <Route path="/customer-support" element={<CustomerSupportApp />} />
      </Routes>
    </div>
  );
}
