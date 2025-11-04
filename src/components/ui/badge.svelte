<script lang="ts">
  import { cn } from '@/lib/utils';
  
  export let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let className: string = '';
  export { className as class };
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-destructive text-white',
    outline: 'text-foreground'
  };
  
  const baseClass = 'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors';
</script>

<span 
  class={cn(baseClass, variants[variant], className)}
  {...$$restProps}
>
  <slot />
</span>
