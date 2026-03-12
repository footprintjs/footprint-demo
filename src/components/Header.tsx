import { Link } from 'react-router-dom';
import { Sun, Moon, Footprints } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Footprints className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">
            footprint<span className="text-emerald-600 dark:text-emerald-400">.js</span>
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1 hidden sm:inline">
            demo apps
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/footprintjs/footPrint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/footprint"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            npm
          </a>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-zinc-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
