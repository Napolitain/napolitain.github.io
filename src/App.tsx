import { Hero } from '@/components/Hero'
import { Projects } from '@/components/Projects'
import { Skills } from '@/components/Skills'
import { Contact } from '@/components/Contact'

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Projects />
      <Skills />
      <Contact />
      
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Napolitain. Built with React & TypeScript.</p>
        </div>
      </footer>
    </div>
  )
}

export default App