import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Code, Desktop, Database, GitBranch, Wrench } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { 
  fetchCombinedRepos, 
  extractSkillsFromCV, 
  extractSkillsFromRepos, 
  categorizeSkills 
} from '@/lib/github'

const USERNAME = 'Napolitain'
const ORG_NAME = 'fds-napolitain'
const CV_REPO = 'cv-overleaf'

interface SkillCategory {
  icon: any
  title: string
  skills: string[]
}

export function Skills() {
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSkills() {
      try {
        const [repos, cvSkills] = await Promise.all([
          fetchCombinedRepos(USERNAME, ORG_NAME, 100),
          extractSkillsFromCV(USERNAME, CV_REPO)
        ])

        const repoSkills = await extractSkillsFromRepos(repos)
        
        const allSkills = [...new Set([...cvSkills, ...repoSkills])]
        
        const categorized = await categorizeSkills(allSkills)
        
        const categories: SkillCategory[] = []
        
        if (categorized.languages.length > 0) {
          categories.push({
            icon: Code,
            title: 'Languages',
            skills: categorized.languages
          })
        }
        
        if (categorized.frontend.length > 0) {
          categories.push({
            icon: Desktop,
            title: 'Frontend',
            skills: categorized.frontend
          })
        }
        
        if (categorized.backend.length > 0) {
          categories.push({
            icon: Database,
            title: 'Backend & Databases',
            skills: categorized.backend
          })
        }
        
        if (categorized.tools.length > 0) {
          categories.push({
            icon: Wrench,
            title: 'Tools & DevOps',
            skills: categorized.tools
          })
        }
        
        if (categorized.other.length > 0) {
          categories.push({
            icon: GitBranch,
            title: 'Other Technologies',
            skills: categorized.other
          })
        }
        
        setSkillCategories(categories)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load skills:', error)
        setSkillCategories([
          {
            icon: Code,
            title: 'Languages',
            skills: ['TypeScript', 'JavaScript', 'Python', 'Java']
          },
          {
            icon: Desktop,
            title: 'Frontend',
            skills: ['React', 'Next.js', 'Tailwind CSS']
          },
          {
            icon: Database,
            title: 'Backend & Databases',
            skills: ['Node.js', 'PostgreSQL', 'MongoDB']
          },
          {
            icon: GitBranch,
            title: 'Tools & DevOps',
            skills: ['Git', 'Docker', 'CI/CD']
          }
        ])
        setLoading(false)
      }
    }

    loadSkills()
  }, [])

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
            Technologies from my repositories ({USERNAME} and {ORG_NAME}) and CV
          </p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-8 space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-22" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && (
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
        )}
      </div>
    </section>
  )
}
