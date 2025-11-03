import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Code, Desktop, Database, GitBranch } from '@phosphor-icons/react'

const skillCategories = [
  {
    icon: Code,
    title: 'Languages',
    skills: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust']
  },
  {
    icon: Desktop,
    title: 'Frontend',
    skills: ['React', 'Next.js', 'Svelte', 'Tailwind CSS', 'Framer Motion']
  },
  {
    icon: Database,
    title: 'Backend & Tools',
    skills: ['Node.js', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS']
  },
  {
    icon: GitBranch,
    title: 'Practices',
    skills: ['Git', 'CI/CD', 'Testing', 'Agile', 'Code Review']
  }
]

export function Skills() {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Skills & Technologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tools and technologies I work with regularly
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card rounded-lg p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <category.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.skills.map(skill => (
                  <Badge 
                    key={skill} 
                    variant="secondary"
                    className="text-sm py-1.5 px-3 hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
