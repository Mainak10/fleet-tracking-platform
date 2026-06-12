import { api, type QueryParams } from './client'

export interface CrudService<T> {
  list(params?: QueryParams): Promise<T[]>
  create(body: Partial<T>): Promise<T>
  update(id: string, body: Partial<T>): Promise<T>
  remove(id: string): Promise<T>
}

/**
 * Build a standard REST service for a collection. Pairs with the mock API's
 * generic CRUD handlers and the `createCrudStore` factory so each master-data
 * entity is wired end to end with a single line.
 */
export function createCrudService<T extends { id: string }>(
  resource: string,
): CrudService<T> {
  const base = `/${resource}`
  return {
    list: (params) => api.get<T[]>(base, params),
    create: (body) => api.post<T>(base, body),
    update: (id, body) => api.put<T>(`${base}/${id}`, body),
    remove: (id) => api.del<T>(`${base}/${id}`),
  }
}
