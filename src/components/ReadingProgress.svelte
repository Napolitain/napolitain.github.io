<script>
  let progress = $state(0);

  function handleScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      progress = Math.min((window.scrollY / docHeight) * 100, 100);
    }
  }

  $effect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<div
  class="fixed top-0 left-0 z-[100] h-[3px] bg-primary transition-[width] duration-150 ease-out"
  style="width: {progress}%"
  role="progressbar"
  aria-valuenow={Math.round(progress)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Reading progress"
></div>
