import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, GitFork, ArrowUpRight } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { fetchCombinedRepos } from '@/lib/github'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  fork: boolean
  owner: {
    login: string
  }
}

const USERNAME = 'Napolitain'
const ORG_NAME = 'fds-napolitain'

export function OtherProjects() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [displayedRepos, setDisplayedRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const INITIAL_DISPLAY = 9

  useEffect(() => {
    async function loadRepos() {
      try {
        const allRepos = await fetchCombinedRepos(USERNAME, ORG_NAME, 100)
        const nonForkRepos = allRepos.filter(repo => !repo.fork)
        
        setRepos(nonForkRepos)
        setDisplayedRepos(nonForkRepos.slice(0, INITIAL_DISPLAY))
        setLoading(false)
      } catch (err) {
        console.error('Failed to load repos:', err)
        setError(true)
        setLoading(false)
      }
    }

    loadRepos()
  }, [])

  const handleShowMore = () => {
    if (showAll) {
      setDisplayedRepos(repos.slice(0, INITIAL_DISPLAY))
      setShowAll(false)
    } else {
      setDisplayedRepos(repos)
      setShowAll(true)
    }
  }

  if (loading) {
    return (
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
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
        </div>
      </section>
    )
  }

  if (error || repos.length === 0) {
    return null
  }

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
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Other Projects</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Additional work from my personal account and {ORG_NAME} organization
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRepos.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {repo.owner.login}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                        {repo.name}
                      </h3>
                    </div>
                    <ArrowUpRight size={20} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all flex-shrink-0 ml-2" />
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed min-h-[2.5rem]">
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

        {repos.length > INITIAL_DISPLAY && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button
              onClick={handleShowMore}
              variant="outline"
              size="lg"
            >
              {showAll ? 'Show Less' : `Show More (${repos.length - INITIAL_DISPLAY} more)`}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
