import { Sidebar } from "./Sidebar";
import { RouteGuard } from "./RouteGuard";
import { EnterpriseTopbar } from "./EnterpriseTopbar";
export function AppLayout({children}:{children:React.ReactNode}){return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Sidebar/><main className="min-h-screen lg:ml-72"><RouteGuard><EnterpriseTopbar/><div className="p-4 lg:p-8">{children}</div></RouteGuard></main></div>}
