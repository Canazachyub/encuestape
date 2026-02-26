export function validateDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}
