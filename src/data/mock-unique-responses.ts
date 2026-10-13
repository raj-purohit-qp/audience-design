import { getLaunchedAudienceProjects } from './mock-audience-projects';
import { MOCK_MULTI_COUNTRY_PARENT } from './mock-multi-country';

export interface UniqueResponseProjectOption {
  value: string;
  label: string;
  status: string;
}

export interface UniqueResponseProjectRef {
  id: string;
  name: string;
}

export function getLaunchedProjectOptions(): UniqueResponseProjectOption[] {
  const standalone = getLaunchedAudienceProjects().map((project) => ({
    value: project.id,
    label: project.name,
    status: project.status,
  }));

  const parentIsLaunched = MOCK_MULTI_COUNTRY_PARENT.status !== 'Bid';
  if (!parentIsLaunched) return standalone;

  const alreadyListed = standalone.some((project) => project.value === MOCK_MULTI_COUNTRY_PARENT.id);
  if (alreadyListed) return standalone;

  return [
    {
      value: MOCK_MULTI_COUNTRY_PARENT.id,
      label: MOCK_MULTI_COUNTRY_PARENT.name,
      status: MOCK_MULTI_COUNTRY_PARENT.status,
    },
    ...standalone,
  ];
}
