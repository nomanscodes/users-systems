import { PageContainer } from "@/components/page-container";

export default function DashboardDefaultPage() {
  return (
    <PageContainer>
      <div>
        <h1 className="ds-page-title">Dashboard</h1>
        <p className="ds-page-subtitle">Welcome back. Your workspace is ready.</p>
      </div>
    </PageContainer>
  );
}
