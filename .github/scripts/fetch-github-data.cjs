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
 * Fetch pinned repositories using the gh-pinned-repos API
 */
async function fetchPinnedRepos() {
  try {
    console.log('Fetching pinned repos...');
    const pinnedData = await httpsGet(`https://gh-pinned-repos.egoist.dev/?username=${USERNAME}`);
    
    // Fetch detailed info for each pinned repo
    const detailedRepos = await Promise.all(
      pinnedData.map(async (pinned) => {
        try {
          const repoData = await httpsGet(`https://api.github.com/repos/${pinned.owner}/${pinned.repo}`);
          return repoData;
        } catch (error) {
          console.error(`Failed to fetch ${pinned.owner}/${pinned.repo}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter out nulls and forks
    return detailedRepos.filter(repo => repo !== null && !repo.fork);
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
 * Extract skills from repositories
 */
function extractSkillsFromRepos(repos) {
  const languages = new Set();
  const topics = new Set();
  
  repos.forEach(repo => {
    if (repo.language) {
      languages.add(repo.language);
    }
    if (repo.topics && Array.isArray(repo.topics)) {
      repo.topics.forEach(topic => topics.add(topic));
    }
  });
  
  return {
    languages: Array.from(languages).sort(),
    topics: Array.from(topics).sort()
  };
}

/**
 * Categorize skills into predefined categories
 */
function categorizeSkills(allSkills) {
  const languageKeywords = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala', 'r', 'perl', 'shell', 'bash', 'powershell', 'html', 'css', 'sql'];
  const frontendKeywords = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'gatsby', 'astro', 'tailwind', 'bootstrap', 'sass', 'less', 'webpack', 'vite', 'rollup'];
  const backendKeywords = ['node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'asp.net', 'fastapi', 'nestjs', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest', 'api'];
  const toolsKeywords = ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github-actions', 'terraform', 'ansible', 'aws', 'azure', 'gcp', 'git', 'ci/cd', 'devops', 'nginx', 'apache'];
  
  const categorized = {
    languages: [],
    frontend: [],
    backend: [],
    tools: [],
    other: []
  };
  
  allSkills.forEach(skill => {
    const lowerSkill = skill.toLowerCase();
    
    if (languageKeywords.some(kw => lowerSkill.includes(kw))) {
      categorized.languages.push(skill);
    } else if (frontendKeywords.some(kw => lowerSkill.includes(kw))) {
      categorized.frontend.push(skill);
    } else if (backendKeywords.some(kw => lowerSkill.includes(kw))) {
      categorized.backend.push(skill);
    } else if (toolsKeywords.some(kw => lowerSkill.includes(kw))) {
      categorized.tools.push(skill);
    } else {
      categorized.other.push(skill);
    }
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
    
    // Extract skills
    const { languages, topics } = extractSkillsFromRepos(uniqueRepos);
    const allSkills = [...languages, ...topics];
    const categorizedSkills = categorizeSkills(allSkills);
    
    // Prepare the output data
    const output = {
      lastUpdated: new Date().toISOString(),
      pinnedRepos: pinnedRepos,
      allRepos: nonForkRepos,
      skills: {
        all: allSkills,
        categorized: categorizedSkills
      },
      metadata: {
        username: USERNAME,
        orgName: ORG_NAME,
        totalRepos: nonForkRepos.length,
        pinnedRepos: pinnedRepos.length,
        totalSkills: allSkills.length
      }
    };
    
    // Write to file
    const outputPath = './src/data/github-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log('✅ Successfully fetched and saved GitHub data!');
    console.log(`   - Pinned repos: ${pinnedRepos.length}`);
    console.log(`   - Total repos: ${nonForkRepos.length}`);
    console.log(`   - Skills: ${allSkills.length}`);
    
  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

// Run the script
main();
