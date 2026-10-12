import type { NextRequest } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";

const RETENTION_MS = 183 * 24 * 60 * 60 * 1000;
const busyUsers = new Set<string>();

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function logAccess(req: NextRequest, userId: string | null, route: string): void {
  prisma.accessLog
    .create({ data: { userId, ip: clientIp(req), route } })
    .then(async () => {
      if (Math.random() < 0.02) {
        await prisma.accessLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } });
      }
    })
    .catch((err) => console.error("access log failed", err));
}

export function tryLockUser(userId: string): boolean {
  if (busyUsers.has(userId)) return false;
  busyUsers.add(userId);
  return true;
}

export function unlockUser(userId: string): void {
  busyUsers.delete(userId);
}
