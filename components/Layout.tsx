import { Sidebar } from "./Sidebar";
import { RouteGuard } from "./RouteGuard";
import { CurrentDateHeader } from "./CurrentDateHeader";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      <main className="min-h-screen p-4 lg:ml-72 lg:p-8">
        <RouteGuard>
          <CurrentDateHeader />
          {children}
        </RouteGuard>
      </main>
    </div>
  );
}
