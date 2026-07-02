

export default function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
      <div className="flex flex-col items-center gap-4">
        {/* Neobrutalist spinner */}
        <div className="w-16 h-16 border-4 border-black border-t-[var(--accent-primary)] rounded-full animate-spin shadow-[4px_4px_0_0_#000]"></div>
        <p className="font-black text-lg uppercase tracking-wider">Memuat...</p>
      </div>
    </div>
  );
}
