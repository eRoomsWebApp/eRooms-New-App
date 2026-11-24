import { useEffect, useState } from 'react';
import { getKnownLeadInfo, LEAD_KNOWN_EVENT } from './tracking';

/** True once this visitor has given name + mobile (re-renders when they do). */
export const useLeadKnown = (): boolean => {
  const [known, setKnown] = useState(() => getKnownLeadInfo().isComplete);
  useEffect(() => {
    const on = () => setKnown(getKnownLeadInfo().isComplete);
    window.addEventListener(LEAD_KNOWN_EVENT, on);
    return () => window.removeEventListener(LEAD_KNOWN_EVENT, on);
  }, []);
  return known;
};
