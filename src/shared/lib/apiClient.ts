import ky from 'ky'

const client = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
})

export const api = {
  get: <T>(path: string) => client.get(path).json<T>(),
  post: <T>(path: string, body: unknown) => client.post(path, { json: body }).json<T>(),
  put: <T>(path: string, body: unknown) => client.put(path, { json: body }).json<T>(),
  delete: <T>(path: string) => client.delete(path).json<T>(),
}
