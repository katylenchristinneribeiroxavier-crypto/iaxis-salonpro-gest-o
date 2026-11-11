export const primaryScreens = new Set(['/', '/app', '/salao', '/master-desenvolvedora']);
export function showsBack(path: string) {
  return !primaryScreens.has(path.replace(/\/$/, '') || '/');
}