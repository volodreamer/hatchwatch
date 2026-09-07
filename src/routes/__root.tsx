import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PersistGate } from "@/components/PersistGate";
import { AppToaster } from "@/components/AppToaster";
import { asset } from "@/lib/asset";
import appCss from "../styles.css?url";

const APP_NAME = "Hatchwatch";
const IS_PAGES = import.meta.env.VITE_GITHUB_PAGES === "1";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Never miss a Tamagotchi Gen 1 care window. Track hearts, discipline, and evolution from hatch to adult.",
      },
      { name: "theme-color", content: "#0e120c" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: asset("favicon.svg") },
      { rel: "icon", type: "image/png", sizes: "192x192", href: asset("icon-192-v2.png") },
      { rel: "apple-touch-icon", sizes: "180x180", href: asset("icon-180-v2.png") },
      { rel: "apple-touch-icon", sizes: "192x192", href: asset("icon-192-v2.png") },
      { rel: "manifest", href: asset("manifest.webmanifest") },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Silkscreen:wght@400;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      ...(!IS_PAGES
        ? [
            { rel: "apple-touch-icon" as const, href: "/__grok/icon-180.png" },
            { rel: "manifest" as const, href: "/__grok/manifest.webmanifest" },
          ]
        : []),
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" data-theme="yellow-black" data-scheme="light" data-shell="duo" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <PersistGate />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <AppToaster />
        <Scripts />
      </body>
    </html>
  ),
});
