import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, GitFork, ArrowUpRight, PushPin } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import githubData from '@/data/github-data.json'

interface Repository {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  fork: boolean
}

const USERNAME = 'Napolitain'

export function Projects() {
  const [pinnedRepos, setPinnedRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function loadRepos() {
      try {
        // Use static data from JSON file instead of API calls
        const pinned = githubData.pinnedRepos
        setPinnedRepos(pinned)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load repos:', err)
        setError(true)
        setLoading(false)
      }
    }

    loadRepos()
  }, [])

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Projects</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            My pinned repositories showcasing my best work (non-forks)
          </p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {(error || (!loading && pinnedRepos.length === 0)) && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {error 
                ? 'Unable to load projects. Please visit my GitHub profile directly.'
                : 'No pinned repositories found. Please visit my GitHub profile to see all projects.'
              }
            </p>
            <a 
              href={`https://github.com/${USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              github.com/{USERNAME}
            </a>
          </Card>
        )}

        {!loading && !error && pinnedRepos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <PushPin size={16} weight="fill" className="text-accent flex-shrink-0" />
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                          {repo.name}
                        </h3>
                      </div>
                      <ArrowUpRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 ml-2" />
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed min-h-[3rem]">
                      {repo.description || 'No description available'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      {repo.topics?.slice(0, 2).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star size={16} weight="fill" className="text-yellow-500" />
                        <span>{repo.stargazers_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork size={16} />
                        <span>{repo.forks_count}</span>
                      </div>
                    </div>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
