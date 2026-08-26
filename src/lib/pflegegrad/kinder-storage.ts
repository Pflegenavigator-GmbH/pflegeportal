import { getAgeGroup, type AgeGroup } from '@/src/lib/pflegegrad/kinder';

const CHILD_NAME_KEY = 'meta_child_name';
const CHILD_AGE_KEY = 'meta_child_age';

export interface PersistedChildInfo {
  name: string;
  age: number;
  ageGroup: AgeGroup;
}

export interface KinderModuleData {
  childInfo: PersistedChildInfo;
  answers: Record<string, number>;
}

/** Flaches JSONB-Format, kompatibel mit bestehenden Moduldatensätzen. */
export function serializeKinderModuleData(
  childInfo: Pick<PersistedChildInfo, 'name' | 'age'>,
  answers: Record<string, number>
): Record<string, string | number> {
  const age = Number.isFinite(childInfo.age) ? Math.min(18, Math.max(0, childInfo.age)) : 0;

  return {
    ...answers,
    [CHILD_NAME_KEY]: childInfo.name.trim().slice(0, 100),
    [CHILD_AGE_KEY]: age,
  };
}

/** Liest sowohl neue Datensätze mit Metadaten als auch alte Antwortobjekte. */
export function parseKinderModuleData(
  value: Record<string, unknown>,
  fallback: PersistedChildInfo
): KinderModuleData {
  const storedAge = value[CHILD_AGE_KEY];
  const age =
    typeof storedAge === 'number' && Number.isFinite(storedAge) && storedAge >= 0 && storedAge <= 18
      ? storedAge
      : fallback.age;
  const storedName = value[CHILD_NAME_KEY];
  const name = typeof storedName === 'string' ? storedName.slice(0, 100) : fallback.name;

  const answers = Object.fromEntries(
    Object.entries(value).filter(
      ([key, answer]) =>
        !key.startsWith('meta_') && typeof answer === 'number' && Number.isFinite(answer)
    )
  ) as Record<string, number>;

  return {
    childInfo: { name, age, ageGroup: getAgeGroup(age) },
    answers,
  };
}
