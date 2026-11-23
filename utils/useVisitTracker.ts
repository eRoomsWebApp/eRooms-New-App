import { useEffect } from 'react';
import { Property } from '../types';
import { sendPartialVisit } from './tracking';

interface VisitTrackerOptions {
  lastAction: string;
  property?: Property;
  area?: string;
  requirement?: string;
  gender?: string;
  budget?: number | string;
  extra1?: string;
}

export const useVisitTracker = (options: VisitTrackerOptions) => {
  const { lastAction, property, area, requirement, gender, budget, extra1 } = options;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sendPartialVisit({
        lastAction,
        property,
        area,
        requirement,
        gender,
        budget,
        extra1
      });
    }, 3000);

    const handlePageHide = () => {
      sendPartialVisit(
        {
          lastAction: `pagehide: ${lastAction}`,
          property,
          area,
          requirement,
          gender,
          budget,
          extra1
        },
        true
      );
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [lastAction, property, area, requirement, gender, budget, extra1]);
};
