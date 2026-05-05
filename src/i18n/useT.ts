import { useApp } from '../state/store';
import { t } from './translations';

export function useT() {
  const locale = useApp((s) => s.locale);
  return (key: string, vars?: Record<string, string>) => t(locale, key, vars);
}
