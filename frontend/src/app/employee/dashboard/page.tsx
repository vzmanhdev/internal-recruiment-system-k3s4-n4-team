import { PersonalWorkspaceShell } from "@/components/layout/PersonalWorkspaceShell";
import { EmployeeDashboard } from "@/features/employee/components/EmployeeDashboard";

export default function EmployeeDashboardPage() {
  return <PersonalWorkspaceShell><EmployeeDashboard /></PersonalWorkspaceShell>;
}
