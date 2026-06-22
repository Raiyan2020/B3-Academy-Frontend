import { createStableId, type EntityRecord, type Repository } from './repository';
import { repositoryFailure, repositorySuccess } from './status.types';

export class InMemoryRepository<T extends EntityRecord, F = Record<string, unknown>>
  implements Repository<T, F, Omit<T, 'id'>>
{
  constructor(private records: T[] = [], private readonly prefix = 'record') {}

  async list(): Promise<ReturnType<typeof repositorySuccess<T[]>>> {
    return repositorySuccess(this.records.map((record) => ({ ...record })));
  }

  async getById(id: string) {
    const record = this.records.find((item) => item.id === id);
    return record
      ? repositorySuccess({ ...record })
      : repositoryFailure('not_found', 'repository.errors.notFound');
  }

  async create(input: Omit<T, 'id'>) {
    const record = { ...input, id: createStableId(this.prefix) } as T;
    this.records = [...this.records, record];
    return repositorySuccess({ ...record });
  }

  async update(id: string, patch: Partial<T>) {
    const index = this.records.findIndex((item) => item.id === id);
    if (index < 0) return repositoryFailure('not_found', 'repository.errors.notFound');
    const record = { ...this.records[index], ...patch, id };
    this.records = this.records.map((item, itemIndex) => (itemIndex === index ? record : item));
    return repositorySuccess({ ...record });
  }

  async remove(id: string) {
    if (!this.records.some((item) => item.id === id)) {
      return repositoryFailure('not_found', 'repository.errors.notFound');
    }
    this.records = this.records.filter((item) => item.id !== id);
    return repositorySuccess(undefined);
  }

  reset(records: T[] = []) {
    this.records = records.map((record) => ({ ...record }));
  }
}
