import { Link } from 'react-router-dom';
import { Sun, Moon, Footprints, Github } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Footprints className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold tracking-tight">
            footprint<span className="text-amber-600 dark:text-amber-400">.js</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <a
            href="https://www.npmjs.com/package/footprintjs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            npm
          </a>
          <a
            href="https://github.com/AmanKirmara/footPrint"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md text-zinc-500 dark:text-zinc-400
              hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
