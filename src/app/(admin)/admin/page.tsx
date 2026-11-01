import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminRootPage() {
  const session = await getSession();

  if (session && session.role === "ADMIN") {
    redirect("/admin/admins");
  }

  redirect("/admin/login");
}
