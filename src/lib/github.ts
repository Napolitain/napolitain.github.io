/**
 * @deprecated This file is no longer used for runtime API calls.
 * 
 * GitHub data is now fetched ahead-of-time (AOT) via GitHub Actions workflow
 * and stored in src/data/github-data.json. Components now import static data
 * instead of making runtime API calls.
 * 
 * See .github/workflows/fetch-github-data.yml and .github/scripts/fetch-github-data.cjs
 * for the new data fetching implementation.
 * 
 * This file is kept for reference but should not be imported in new code.
 */

interface PinnedRepo {
  owner: string
  repo: string
  description: string
  language: string
  languageColor: string
  stars: number
  forks: number
}

interface GitHubRepo {
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

export async function fetchPinnedRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${username}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch pinned repos')
    }
    
    const pinnedRepos: PinnedRepo[] = await response.json()
    
    const detailedRepos = await Promise.all(
      pinnedRepos.map(async (pinned) => {
        const repoResponse = await fetch(`https://api.github.com/repos/${pinned.owner}/${pinned.repo}`)
        if (!repoResponse.ok) {
          return null
        }
        const repoData: GitHubRepo = await repoResponse.json()
        return repoData
      })
    )
    
    return detailedRepos.filter((repo): repo is GitHubRepo => repo !== null && !repo.fork)
  } catch (error) {
    console.error('Error fetching pinned repos:', error)
    return []
  }
}

export async function fetchAllRepos(username: string, limit: number = 100): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}&type=owner`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch repos')
    }
    
    const repos: GitHubRepo[] = await response.json()
    return repos
  } catch (error) {
    console.error('Error fetching repos:', error)
    return []
  }
}

export async function fetchOrgRepos(orgName: string, limit: number = 100): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=${limit}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch org repos')
    }
    
    const repos: GitHubRepo[] = await response.json()
    return repos
  } catch (error) {
    console.error('Error fetching org repos:', error)
    return []
  }
}

export async function fetchCombinedRepos(username: string, orgName: string, limit: number = 100): Promise<GitHubRepo[]> {
  try {
    const [userRepos, orgRepos] = await Promise.all([
      fetchAllRepos(username, limit),
      fetchOrgRepos(orgName, limit)
    ])
    
    const combined = [...userRepos, ...orgRepos]
    const uniqueRepos = combined.filter((repo, index, self) =>
      index === self.findIndex((r) => r.id === repo.id)
    )
    
    uniqueRepos.sort((a, b) => {
      const dateA = new Date(a.html_url).getTime()
      const dateB = new Date(b.html_url).getTime()
      return dateB - dateA
    })
    
    return uniqueRepos
  } catch (error) {
    console.error('Error fetching combined repos:', error)
    return []
  }
}

export async function extractSkillsFromCV(username: string, repoName: string = 'cv-overleaf'): Promise<string[]> {
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents`)
    
    if (!response.ok) {
      console.error('CV repo not found or not accessible')
      return []
    }
    
    const contents = await response.json()
    
    const texFiles = contents.filter((file: any) => 
      file.name.endsWith('.tex') || file.name.endsWith('.txt') || file.name === 'README.md'
    )
    
    if (texFiles.length === 0) {
      return []
    }
    
    const fileContents = await Promise.all(
      texFiles.slice(0, 3).map(async (file: any) => {
        const fileResponse = await fetch(file.download_url)
        return fileResponse.text()
      })
    )
    
    const combinedText = fileContents.join('\n')
    
    const promptText = `You are analyzing a resume/CV repository to extract technical skills and technologies.

Content from CV:
${combinedText}

Extract ALL technical skills, programming languages, frameworks, tools, and technologies mentioned.
Return ONLY a JSON object with a single property "skills" containing an array of skill strings.
Each skill should be a single technology name (e.g., "React", "Python", "Docker").
Remove duplicates and sort alphabetically.

Example format:
{
  "skills": ["AWS", "Docker", "JavaScript", "Python", "React"]
}`
    
    const result = await window.spark.llm(promptText, 'gpt-4o-mini', true)
    const parsed = JSON.parse(result)
    
    return parsed.skills || []
  } catch (error) {
    console.error('Error extracting skills from CV:', error)
    return []
  }
}

export async function extractSkillsFromRepos(repos: GitHubRepo[]): Promise<string[]> {
  const languages = new Set<string>()
  const topics = new Set<string>()
  
  repos.forEach(repo => {
    if (repo.language) {
      languages.add(repo.language)
    }
    repo.topics?.forEach(topic => topics.add(topic))
  })
  
  return [...languages, ...topics]
}

export async function categorizeSkills(skills: string[]): Promise<{
  languages: string[]
  frontend: string[]
  backend: string[]
  tools: string[]
  other: string[]
}> {
  const promptText = `Categorize the following technical skills into these categories:
- languages (programming languages)
- frontend (frontend frameworks, libraries, UI tools)
- backend (backend frameworks, databases, servers, APIs)
- tools (DevOps, tools, cloud services, version control)
- other (anything that doesn't fit above)

Skills to categorize:
${skills.join(', ')}

Return ONLY a JSON object with properties: languages, frontend, backend, tools, other
Each property should be an array of strings from the input list.

Example format:
{
  "languages": ["Python", "JavaScript"],
  "frontend": ["React", "Vue"],
  "backend": ["Node.js", "PostgreSQL"],
  "tools": ["Docker", "Git"],
  "other": ["Machine Learning"]
}`

  try {
    const result = await window.spark.llm(promptText, 'gpt-4o-mini', true)
    const categorized = JSON.parse(result)
    
    return {
      languages: categorized.languages || [],
      frontend: categorized.frontend || [],
      backend: categorized.backend || [],
      tools: categorized.tools || [],
      other: categorized.other || []
    }
  } catch (error) {
    console.error('Error categorizing skills:', error)
    return {
      languages: [],
      frontend: [],
      backend: [],
      tools: [],
      other: skills
    }
  }
}
