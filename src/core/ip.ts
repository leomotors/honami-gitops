export function getIP(
  req: Request,
  server: Bun.Server<unknown> | null,
): string {
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;

  const cachedIP = req.headers.get("x-ip");
  if (cachedIP) return cachedIP;

  return server?.requestIP(req)?.address ?? "unknown";
}

export function isLocalIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  );
}
