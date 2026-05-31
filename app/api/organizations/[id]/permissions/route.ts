import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const permissions = await prisma.permission.findMany({
    where: {
      roles: {
        some: {
          role: {
            organizationId: id
          }
        }
      }
    }
  });
  return jsonOk(permissions);
}
