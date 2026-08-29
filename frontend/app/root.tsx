import {
  isRouteErrorResponse,
  Links,
  Link,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { BarChart3, CalendarDays, Upload } from "lucide-react";
import { Toaster } from "sonner";
import type { Route } from "./+types/root";
import NavDropdown from "./components/layout/NavDropdown";
import UserMenu from "./components/layout/UserMenu";
import "./app.css";
import "sonner/dist/styles.css";

const NAV = [
  { href: "/add", label: "添加 CSV 数据", icon: Upload },
  { href: "/browse", label: "按日期浏览", icon: CalendarDays },
  { href: "/report", label: "对比分析", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>my Trace It</title>
        <link rel="icon" type="image/png" href="/trace-it-android.png" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** SPA mode: the shell rendered by the static index.html before the app hydrates. */
export function HydrateFallback() {
  return (
    <main className="flex flex-1 items-center justify-center text-sm text-zinc-400">
      加载中…
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <>
      {!isLogin && (
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-3 sm:gap-6">
          <Link to="/" aria-label="Trace It" className="shrink-0">
            <img
              src="/trace-it-android.png"
              alt="Trace It"
              className="h-8 w-8 rounded-lg"
            />
          </Link>
          <div className="flex flex-1 items-center justify-between gap-x-2 px-2 text-sm sm:flex-wrap sm:justify-start sm:gap-x-6 sm:gap-y-1 sm:px-0">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <NavDropdown />
            <UserMenu />
          </div>
        </nav>
      </header>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster theme="system" richColors position="bottom-center" />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}