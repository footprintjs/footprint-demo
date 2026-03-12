import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoanApp } from './apps/loan-application/LoanApp';
import { useTheme } from './hooks/useTheme';
import './App.css';

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Header theme={theme} onToggleTheme={toggle} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/loan-application" element={<LoanApp />} />
      </Routes>
    </div>
  );
}
