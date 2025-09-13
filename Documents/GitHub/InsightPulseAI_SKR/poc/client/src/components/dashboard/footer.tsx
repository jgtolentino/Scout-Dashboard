export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>2,847 records</span>
          <span>Query time: 0.24s</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="status-dot fresh"></span>
            <span>Data fresh</span>
          </div>
          <span>© 2025 Client360</span>
        </div>
      </div>
    </footer>
  );
}
