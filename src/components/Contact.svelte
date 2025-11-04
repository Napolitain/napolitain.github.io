<script lang="ts">
  import { fly } from 'svelte/transition';
  import { GithubLogo, LinkedinLogo, EnvelopeSimple } from 'phosphor-svelte';
  import Button from '@/components/ui/button.svelte';
  import Card from '@/components/ui/card.svelte';
</script>

<section id="contact" class="py-24 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="text-center" in:fly={{ y: 20, duration: 500 }}>
      <h2 class="text-4xl md:text-5xl font-bold mb-4">Let's Connect</h2>
      <p class="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
        I'm always interested in hearing about new opportunities, 
        collaborations, or just having a chat about technology.
      </p>

      <Card class="p-8 md:p-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a 
            href="https://github.com/Napolitain" 
            target="_blank" 
            rel="noopener noreferrer"
            class="h-auto flex flex-col gap-3 py-6 px-6 border rounded-md bg-background shadow-xs hover:bg-primary/5 hover:text-accent-foreground hover:border-primary transition-all items-center justify-center"
          >
            <GithubLogo size={32} />
            <div>
              <div class="font-semibold">GitHub</div>
              <div class="text-xs text-muted-foreground">@Napolitain</div>
            </div>
          </a>

          <a 
            href="https://linkedin.com/in/mxboucher" 
            target="_blank" 
            rel="noopener noreferrer"
            class="h-auto flex flex-col gap-3 py-6 px-6 border rounded-md bg-background shadow-xs hover:bg-primary/5 hover:text-accent-foreground hover:border-primary transition-all items-center justify-center"
          >
            <LinkedinLogo size={32} />
            <div>
              <div class="font-semibold">LinkedIn</div>
              <div class="text-xs text-muted-foreground">@mxboucher</div>
            </div>
          </a>

          <a 
            href="mailto:mxboucher@gmail.com"
            class="h-auto flex flex-col gap-3 py-6 px-6 border rounded-md bg-background shadow-xs hover:bg-accent/5 hover:text-accent-foreground hover:border-accent transition-all items-center justify-center"
          >
            <EnvelopeSimple size={32} />
            <div>
              <div class="font-semibold">Email</div>
              <div class="text-xs text-muted-foreground">Say hello</div>
            </div>
          </a>
        </div>
      </Card>
    </div>
  </div>
</section>
