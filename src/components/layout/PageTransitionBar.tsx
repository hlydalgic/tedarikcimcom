export function PageTransitionBar() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px] overflow-hidden bg-primary/15"
      aria-hidden
    >
      <div className="page-transition-bar h-full w-1/3 bg-primary" />
    </div>
  );
}
