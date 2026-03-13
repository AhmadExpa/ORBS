import { cookies } from "next/headers";

export async function hasStaffSession() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("eo_staff_session")?.value);
}

