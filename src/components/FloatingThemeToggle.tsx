import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-[60] h-12 w-12 rounded-full shadow-lg backdrop-blur bg-background/80 border border-border hover:shadow-xl transition-all"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
