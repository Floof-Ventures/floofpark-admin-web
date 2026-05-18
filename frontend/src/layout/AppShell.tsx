export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 24px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>FloofPark</span>
        <span
          aria-label="Admin"
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 4,
            background: "#1f2937",
            color: "white",
            letterSpacing: 0.4,
          }}
        >
          ADMIN
        </span>
      </header>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
