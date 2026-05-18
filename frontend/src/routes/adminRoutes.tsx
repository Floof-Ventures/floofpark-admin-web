import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/auth/LoginPage";
import { MagicLinkConsumePage } from "@/auth/MagicLinkConsumePage";
import { SuperadminGate } from "@/auth/SuperadminGate";
import { AppShell } from "@/layout/AppShell";
import { TenantDetailPage } from "@/modules/tenants/TenantDetailPage";
import { TenantsListPage } from "@/modules/tenants/TenantsListPage";

function GatedPage({ children }: { children: React.ReactNode }) {
  return (
    <SuperadminGate>
      <AppShell>{children}</AppShell>
    </SuperadminGate>
  );
}

export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tenants" replace />} />
      <Route path="/login" element={<AppShell><LoginPage /></AppShell>} />
      <Route path="/auth/consume" element={<AppShell><MagicLinkConsumePage /></AppShell>} />
      <Route path="/tenants" element={<GatedPage><TenantsListPage /></GatedPage>} />
      <Route path="/tenants/:id" element={<GatedPage><TenantDetailPage /></GatedPage>} />
      <Route path="*" element={<AppShell><p>Not found.</p></AppShell>} />
    </Routes>
  );
}
