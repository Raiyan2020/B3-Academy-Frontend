import type { RepositoryResult } from './status.types';

export interface EntityRecord {
  id: string;
}

export interface Repository<T extends EntityRecord, F = Record<string, unknown>, C = Partial<Omit<T, 'id'>>> {
  list(filters?: F): Promise<RepositoryResult<T[]>>;
  getById(id: string): Promise<RepositoryResult<T>>;
  create(input: C): Promise<RepositoryResult<T>>;
  update(id: string, patch: Partial<T>): Promise<RepositoryResult<T>>;
  remove(id: string): Promise<RepositoryResult<void>>;
}

export interface StorageMigration<T> {
  version: number;
  migrate(value: unknown): T[];
}

export interface VersionedStorageEnvelope<T> {
  version: number;
  records: T[];
}

export function normalizeStoredRecords<T>(
  value: unknown,
  migration: StorageMigration<T>,
): VersionedStorageEnvelope<T> {
  if (
    value &&
    typeof value === 'object' &&
    'version' in value &&
    'records' in value &&
    (value as VersionedStorageEnvelope<T>).version === migration.version &&
    Array.isArray((value as VersionedStorageEnvelope<T>).records)
  ) {
    return value as VersionedStorageEnvelope<T>;
  }

  return { version: migration.version, records: migration.migrate(value) };
}

export const createStableId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
