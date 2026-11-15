import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../utils/theme';
import { Button } from './Button';

export function ThemeToggle({ locale = 'vi' }: { locale?: 'vi' | 'en' }) {
  const { theme, toggleTheme } = useTheme();
  const label = locale === 'en'
    ? theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    : theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
    </Button>
  );
}
