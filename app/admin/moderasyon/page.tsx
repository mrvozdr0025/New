import { getOpenReports } from "@/app/actions/admin"
import { ReportList } from "@/components/admin/report-list"

export default async function AdminModerationPage() {
  const reports = await getOpenReports()
  return <ReportList reports={reports} />
}
