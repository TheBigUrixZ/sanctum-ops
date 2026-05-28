import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "./logout-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAE Inventory",
  description: "Local clothing brand inventory tracker",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/inventory", label: "Inventory" },
  { href: "/labels", label: "Labels" },
  { href: "/scan", label: "Scan Mode" },
  { href: "/business", label: "Business" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/">
              <span className="brand-mark">CAE</span>
              <span>
                <strong>Inventory</strong>
                <small>Local tracker</small>
              </span>
            </Link>
            <nav>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <LogoutButton />
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
