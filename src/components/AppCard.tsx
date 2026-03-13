import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface AppCardProps {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  tags: string[];
}

export function AppCard({ to, title, description, icon, tags }: AppCardProps) {
  return (
    <Link
      to={to}
      className="group block rounded-xl border border-stone-200/80 dark:border-zinc-800
        bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm p-5 sm:p-6
        hover:border-amber-300/60 dark:hover:border-amber-700/40
        hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full
                  bg-stone-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400
                  border border-stone-200/60 dark:border-zinc-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
