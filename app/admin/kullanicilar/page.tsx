import { getUserAdminList } from "@/app/actions/admin"
import { UserAdminTable } from "@/components/admin/user-admin-table"

export default async function AdminUsersPage() {
  const users = await getUserAdminList()
  return <UserAdminTable users={users} />
}
