export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function isAuthed(): boolean {
  return !!getToken();
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  // optional: clear other cached info here
  window.location.href = "/"; // go to homepage
}
