import { NextRequest } from "next/server";

export function isAdminAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get("admin-auth")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD || "hiroki-bjj-admin";
  return cookie === adminPassword;
}
