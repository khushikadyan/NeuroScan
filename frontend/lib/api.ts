// frontend/lib/api.ts
export async function api(
  path: string,
  options: RequestInit = {},
  token?: string
) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const url = base + path;

  const headers: Record<string,string> = {
    "Content-Type": "application/json",
    ...(options.headers as any),
  };

  if (token) {
    headers["Authorization"] = token; // your backend expects raw token (NOT Bearer)
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
