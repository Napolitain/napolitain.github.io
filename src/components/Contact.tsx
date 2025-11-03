import { motion } from 'framer-motion'
import { GithubLogo, LinkedinLogo, EnvelopeSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function Contact() {
  return (
    <section id="contact" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Let's Connect</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            I'm always interested in hearing about new opportunities, 
            collaborations, or just having a chat about technology.
          </p>

          <Card className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto flex-col gap-3 py-6 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <a href="https://github.com/Napolitain" target="_blank" rel="noopener noreferrer">
                  <GithubLogo size={32} />
                  <div>
                    <div className="font-semibold">GitHub</div>
                    <div className="text-xs text-muted-foreground">@Napolitain</div>
                  </div>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto flex-col gap-3 py-6 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <a href="https://linkedin.com/in/napolitain" target="_blank" rel="noopener noreferrer">
                  <LinkedinLogo size={32} />
                  <div>
                    <div className="font-semibold">LinkedIn</div>
                    <div className="text-xs text-muted-foreground">Connect with me</div>
                  </div>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-auto flex-col gap-3 py-6 hover:border-accent hover:bg-accent/5 transition-all"
              >
                <a href="mailto:hello@napolitain.dev">
                  <EnvelopeSimple size={32} />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-xs text-muted-foreground">Say hello</div>
                  </div>
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
