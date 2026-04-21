import { TopNavbar } from "@/components/layout/TopNavbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--page-background)" }}>
      <TopNavbar />
      <main className="flex flex-1 items-center justify-center">
        <p className="label-text-sm" style={{ color: "var(--text-muted-foreground)" }}>
          Dashboard content goes here
        </p>
      </main>
    </div>
  );
}
