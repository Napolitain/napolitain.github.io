import { motion } from 'framer-motion'
import { GithubLogo, LinkedinLogo, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-4xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4">
            Napolitain
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium mb-6">
            Software Engineer
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Building elegant solutions to complex problems. 
            Passionate about clean code, modern web technologies, and open source.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Button 
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground group"
          >
            <a href="#projects">
              View Projects
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
          <Button 
            asChild
            size="lg"
            variant="outline"
          >
            <a href="#contact">
              Get in Touch
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4 pt-8"
        >
          <a 
            href="https://github.com/Napolitain" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-card hover:bg-secondary transition-colors shadow-sm"
          >
            <GithubLogo size={24} className="text-foreground" />
          </a>
          <a 
            href="https://linkedin.com/in/napolitain" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-card hover:bg-secondary transition-colors shadow-sm"
          >
            <LinkedinLogo size={24} className="text-foreground" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
