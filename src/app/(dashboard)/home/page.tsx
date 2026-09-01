'use client';

import { useEffect, useState } from 'react';
import { HomeProductChooser } from '@/components/home/HomeProductChooser';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { hasCreatedAudienceProjects } from '@/data/mock-home';

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [hasProjects, setHasProjects] = useState(false);

  useEffect(() => {
    setHasProjects(hasCreatedAudienceProjects());
    setReady(true);
  }, []);

  if (!ready) return null;

  return hasProjects ? <HomeDashboard /> : <HomeProductChooser />;
}
