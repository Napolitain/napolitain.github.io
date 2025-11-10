const fs = require('fs');
const https = require('https');

const USERNAME = 'Napolitain';
const ORG_NAME = 'fds-napolitain';

/**
 * Make HTTPS request
 */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'GitHub-Portfolio-Script',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch pinned repositories using GitHub GraphQL API
 */
async function fetchPinnedRepos() {
  try {
    console.log('Fetching pinned repos...');
    
    // GitHub GraphQL query to fetch pinned repos
    const query = `
      query {
        user(login: "${USERNAME}") {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                id
                name
                description
                url
                stargazerCount
                forkCount
                primaryLanguage {
                  name
                }
                repositoryTopics(first: 10) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
                isFork
                owner {
                  login
                }
              }
            }
          }
        }
      }
    `;
    
    // Make GraphQL request to GitHub
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query });
      
      const options = {
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'GitHub-Portfolio-Script',
          'Accept': 'application/json'
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Failed to parse JSON: ' + e.message));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    // Transform GraphQL response to match REST API format
    const pinnedItems = response.data?.user?.pinnedItems?.nodes || [];
    const detailedRepos = pinnedItems
      .filter(repo => !repo.isFork)
      .map(repo => ({
        id: Math.abs(repo.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)), // Generate numeric ID from GraphQL ID
        name: repo.name,
        full_name: `${repo.owner.login}/${repo.name}`,
        description: repo.description,
        html_url: repo.url,
        stargazers_count: repo.stargazerCount,
        forks_count: repo.forkCount,
        language: repo.primaryLanguage?.name || null,
        topics: repo.repositoryTopics?.nodes?.map(node => node.topic.name) || [],
        fork: repo.isFork,
        owner: {
          login: repo.owner.login
        }
      }));
    
    return detailedRepos;
  } catch (error) {
    console.error('Error fetching pinned repos:', error.message);
    return [];
  }
}

/**
 * Fetch all repositories for a user
 */
async function fetchUserRepos(username, perPage = 100) {
  try {
    console.log(`Fetching repos for ${username}...`);
    const repos = await httpsGet(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&type=owner`);
    return repos;
  } catch (error) {
    console.error(`Error fetching ${username} repos:`, error.message);
    return [];
  }
}

/**
 * Fetch all repositories for an organization
 */
async function fetchOrgRepos(orgName, perPage = 100) {
  try {
    console.log(`Fetching repos for ${orgName} org...`);
    const repos = await httpsGet(`https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=${perPage}`);
    return repos;
  } catch (error) {
    console.error(`Error fetching ${orgName} repos:`, error.message);
    return [];
  }
}

/**
 * Extract skills from repositories with occurrence counts
 */
function extractSkillsFromRepos(repos) {
  const languageCounts = new Map();
  const topicCounts = new Map();
  
  repos.forEach(repo => {
    if (repo.language) {
      const lang = repo.language;
      languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
    }
    if (repo.topics && Array.isArray(repo.topics)) {
      repo.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    }
  });
  
  return {
    languageCounts,
    topicCounts
  };
}

/**
 * Categorize skills into predefined categories with occurrence counts
 */
function categorizeSkills(skillsMap) {
  // Comprehensive categorization based on the issue requirements
  const categories = {
    // Languages - programming languages
    languages: new Set([
      'typescript', 'python', 'go', 'c++', 'javascript', 'c#', 'java', 'kotlin', 
      'netlogo', 'c', 'cpp', 'csharp', 'js'
    ]),
    
    // Frontend - UI/UX frameworks and libraries
    frontend: new Set([
      'svelte', 'nextjs', 'react', 'next', 'vue', 'angular', 'astro', 
      'tailwind', 'bootstrap', 'canvas'
    ]),
    
    // Backend & Databases - server-side and data storage
    backend: new Set([
      'flask', 'redis', 'node', 'express', 'django', 'spring', 'rails', 
      'laravel', 'fastapi', 'nestjs', 'postgresql', 'mysql', 'mongodb', 
      'elasticsearch', 'graphql', 'caldav-server', 'network'
    ]),
    
    // Tools & DevOps - development tools, build systems, and DevOps
    tools: new Set([
      'docker', 'kubernetes', 'jenkins', 'gitlab', 'github-actions', 
      'terraform', 'ansible', 'aws', 'azure', 'gcp', 'git', 'cmake', 
      'dotenv', 'puppeteer', 'headless-chrome'
    ]),
    
    // Game Development - game engines, graphics, and game-related technologies
    gamedev: new Set([
      'unity', 'game-development', 'game-engine', 'opengl', 'shaderlab', 
      'raytracing', 'game', 'qt'
    ]),
    
    // AI & Machine Learning - artificial intelligence and machine learning
    aiml: new Set([
      'ai', 'artificial-intelligence', 'tensorflow', 'genetic-algorithm', 
      'linear-programming', 'operations-research'
    ]),
    
    // Computer Vision & Graphics - image processing and computer vision
    vision: new Set([
      'opencv', 'image', 'image-processing', 'inpainting', 'hdr', 
      'augmented-reality', 'mixed-reality', 'virtual-reality', 
      'motion-tracking', 'object-tracking'
    ]),
    
    // Multimedia & Signal Processing - audio, video, and signal processing
    multimedia: new Set([
      'ffmpeg', 'video-editing', 'music', 'dsp', 'signal-processing', 
      'digital-signal-processing'
    ]),
    
    // Desktop & Framework - desktop application frameworks
    desktop: new Set([
      'dotnet', 'tkinter', 'windows', 'uwp'
    ]),
    
    // Other Technologies - everything else
    other: new Set([
      'html', 'tex', 'total-war', 'esports', 'icalendar', 
      'liquipedia', 'web-scraping', 'keyrate', 'utility', 'bot', 
      'university', 'template', 'compression', 'security'
    ])
  };
  
  const categorized = {
    languages: [],
    frontend: [],
    backend: [],
    tools: [],
    gamedev: [],
    aiml: [],
    vision: [],
    multimedia: [],
    desktop: [],
    other: []
  };
  
  skillsMap.forEach((count, skill) => {
    const lowerSkill = skill.toLowerCase();
    
    // Check exact matches first
    let categorizedFlag = false;
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.has(lowerSkill)) {
        categorized[category].push({ name: skill, count });
        categorizedFlag = true;
        break;
      }
    }
    
    // If no exact match, try partial matches for complex names
    if (!categorizedFlag) {
      if (['typescript', 'javascript', 'python', 'java', 'kotlin', 'c++', 'c#', 'go'].some(kw => lowerSkill.includes(kw))) {
        categorized.languages.push({ name: skill, count });
      } else if (['react', 'vue', 'svelte', 'next', 'angular', 'tailwind'].some(kw => lowerSkill.includes(kw))) {
        categorized.frontend.push({ name: skill, count });
      } else if (['flask', 'redis', 'django', 'mongodb', 'postgresql', 'mysql', 'graphql'].some(kw => lowerSkill.includes(kw))) {
        categorized.backend.push({ name: skill, count });
      } else if (['docker', 'kubernetes', 'git', 'cmake', 'terraform', 'ansible'].some(kw => lowerSkill.includes(kw))) {
        categorized.tools.push({ name: skill, count });
      } else if (['unity', 'game', 'opengl', 'raytracing'].some(kw => lowerSkill.includes(kw))) {
        categorized.gamedev.push({ name: skill, count });
      } else if (['tensorflow', 'ai', 'artificial-intelligence'].some(kw => lowerSkill.includes(kw))) {
        categorized.aiml.push({ name: skill, count });
      } else if (['opencv', 'image', 'vision', 'augmented-reality', 'virtual-reality'].some(kw => lowerSkill.includes(kw))) {
        categorized.vision.push({ name: skill, count });
      } else if (['video', 'audio', 'music', 'ffmpeg', 'signal'].some(kw => lowerSkill.includes(kw))) {
        categorized.multimedia.push({ name: skill, count });
      } else if (['dotnet', 'tkinter', 'uwp', 'qt'].some(kw => lowerSkill.includes(kw))) {
        categorized.desktop.push({ name: skill, count });
      } else {
        categorized.other.push({ name: skill, count });
      }
    }
  });
  
  // Sort each category by count (descending) then by name
  Object.keys(categorized).forEach(category => {
    categorized[category].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  });
  
  return categorized;
}

/**
 * Main function to fetch and save GitHub data
 */
async function main() {
  try {
    console.log('Starting GitHub data fetch...');
    
    // Fetch all data in parallel
    const [pinnedRepos, userRepos, orgRepos] = await Promise.all([
      fetchPinnedRepos(),
      fetchUserRepos(USERNAME),
      fetchOrgRepos(ORG_NAME)
    ]);
    
    // Combine user and org repos
    const allRepos = [...userRepos, ...orgRepos];
    
    // Remove duplicates based on id
    const uniqueRepos = Array.from(
      new Map(allRepos.map(repo => [repo.id, repo])).values()
    );
    
    // Filter out forks for the "allRepos" section
    const nonForkRepos = uniqueRepos.filter(repo => !repo.fork);
    
    // Sort by updated date
    nonForkRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    // Extract skills with occurrence counts
    const { languageCounts, topicCounts } = extractSkillsFromRepos(uniqueRepos);
    
    // Combine all skills with their counts
    const allSkillsMap = new Map([...languageCounts, ...topicCounts]);
    
    // Filter skills that appear at least twice
    const filteredSkills = new Map();
    allSkillsMap.forEach((count, skill) => {
      if (count >= 2) {
        filteredSkills.set(skill, count);
      }
    });
    
    const categorizedSkills = categorizeSkills(filteredSkills);
    
    // Validate that we actually fetched data before writing to file
    if (nonForkRepos.length === 0) {
      console.error('❌ Error: No repositories were fetched. This likely indicates an API rate limit or authentication issue.');
      console.error('   The workflow should not proceed with empty data.');
      process.exit(1);
    }
    
    // Prepare the output data
    const output = {
      lastUpdated: new Date().toISOString(),
      pinnedRepos: pinnedRepos,
      allRepos: nonForkRepos,
      skills: {
        all: Array.from(allSkillsMap.entries()).map(([name, count]) => ({ name, count })),
        filtered: Array.from(filteredSkills.entries()).map(([name, count]) => ({ name, count })),
        categorized: categorizedSkills
      },
      metadata: {
        username: USERNAME,
        orgName: ORG_NAME,
        totalRepos: nonForkRepos.length,
        pinnedRepos: pinnedRepos.length,
        totalSkills: allSkillsMap.size,
        filteredSkills: filteredSkills.size
      }
    };
    
    // Write to file
    const outputPath = './src/data/github-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log('✅ Successfully fetched and saved GitHub data!');
    console.log(`   - Pinned repos: ${pinnedRepos.length}`);
    console.log(`   - Total repos: ${nonForkRepos.length}`);
    console.log(`   - Total skills: ${allSkillsMap.size}`);
    console.log(`   - Filtered skills (≥2 occurrences): ${filteredSkills.size}`);
    
  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

// Run the script
main();
