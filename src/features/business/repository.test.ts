import { describe, expect, it } from 'vitest';
import { InMemoryRepository } from './in-memory-repository';
import { normalizeStoredRecords } from './repository';

interface Item {
  id: string;
  name: string;
}

describe('frontend repository contract', () => {
  it('supports replaceable CRUD behavior without exposing storage keys', async () => {
    const repository = new InMemoryRepository<Item>([], 'item');
    const created = await repository.create({ name: 'Configured record' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect((await repository.getById(created.value.id)).ok).toBe(true);
    expect((await repository.update(created.value.id, { name: 'Updated' })).ok).toBe(true);
    expect((await repository.remove(created.value.id)).ok).toBe(true);
    expect((await repository.getById(created.value.id)).ok).toBe(false);
  });

  it('migrates legacy values into a versioned envelope', () => {
    const normalized = normalizeStoredRecords(['legacy'], {
      version: 2,
      migrate: (value) =>
        Array.isArray(value) ? value.map((name, index) => ({ id: `legacy-${index}`, name: String(name) })) : [],
    });

    expect(normalized).toEqual({ version: 2, records: [{ id: 'legacy-0', name: 'legacy' }] });
  });
});
