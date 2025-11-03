#!/usr/bin/env node

/**
 * GitHub Data Fetcher
 * 
 * This script fetches public repository data from GitHub and stores it as a static JSON file.
 * It ensures NO private data is included - only public repositories are fetched.
 */

const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.USERNAME || 'Napolitain';
const ORG_NAME = process.env.ORG_NAME || 'fds-napolitain';
const CV_REPO = process.env.CV_REPO || 'cv-overleaf';

// Ensure we have a token
if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Portfolio-Generator'
};

/**
 * Fetch pinned repositories using gh-pinned-repos API
 */
async function fetchPinnedRepos() {
  try {
    console.log('Fetching pinned repositories...');
    const response = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${USERNAME}`);
    
    if (!response.ok) {
      console.error('Failed to fetch pinned repos:', response.status);
      return [];
    }
    
    const pinnedRepos = await response.json();
    
    // Fetch detailed information for each pinned repo
    const detailedRepos = await Promise.all(
      pinnedRepos.map(async (pinned) => {
        const repoResponse = await fetch(
          `https://api.github.com/repos/${pinned.owner}/${pinned.repo}`,
          { headers }
        );
        
        if (!repoResponse.ok) {
          console.warn(`Failed to fetch details for ${pinned.owner}/${pinned.repo}`);
          return null;
        }
        
        const repoData = await repoResponse.json();
        
        // SECURITY: Only include public, non-fork repositories
        if (repoData.private || repoData.fork) {
          console.log(`Skipping ${repoData.full_name} (private: ${repoData.private}, fork: ${repoData.fork})`);
          return null;
        }
        
        return {
          id: repoData.id,
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          html_url: repoData.html_url,
          stargazers_count: repoData.stargazers_count,
          forks_count: repoData.forks_count,
          language: repoData.language,
          topics: repoData.topics || [],
          fork: repoData.fork,
          owner: {
            login: repoData.owner.login
          }
        };
      })
    );
    
    const validRepos = detailedRepos.filter(repo => repo !== null);
    console.log(`Found ${validRepos.length} valid pinned repositories`);
    return validRepos;
  } catch (error) {
    console.error('Error fetching pinned repos:', error);
    return [];
  }
}

/**
 * Fetch all public repositories for a user
 */
async function fetchUserRepos(username) {
  try {
    console.log(`Fetching repositories for user: ${username}...`);
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100&type=owner`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch repos for ${username}:`, response.status);
      return [];
    }
    
    const repos = await response.json();
    
    // SECURITY: Filter to only include public, non-fork repositories
    const publicRepos = repos
      .filter(repo => !repo.private && !repo.fork)
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        fork: repo.fork,
        owner: {
          login: repo.owner.login
        }
      }));
    
    console.log(`Found ${publicRepos.length} public repositories for ${username}`);
    return publicRepos;
  } catch (error) {
    console.error(`Error fetching repos for ${username}:`, error);
    return [];
  }
}

/**
 * Fetch all public repositories for an organization
 */
async function fetchOrgRepos(orgName) {
  try {
    console.log(`Fetching repositories for organization: ${orgName}...`);
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?sort=updated&per_page=100&type=public`,
      { headers }
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch repos for org ${orgName}:`, response.status);
      return [];
    }
    
    const repos = await response.json();
    
    // SECURITY: Filter to only include public, non-fork repositories
    const publicRepos = repos
      .filter(repo => !repo.private && !repo.fork)
      .map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        fork: repo.fork,
        owner: {
          login: repo.owner.login
        }
      }));
    
    console.log(`Found ${publicRepos.length} public repositories for ${orgName}`);
    return publicRepos;
  } catch (error) {
    console.error(`Error fetching repos for org ${orgName}:`, error);
    return [];
  }
}

/**
 * Extract skills from languages and topics in repositories
 */
function extractSkillsFromRepos(repos) {
  const languages = new Set();
  const topics = new Set();
  
  repos.forEach(repo => {
    if (repo.language) {
      languages.add(repo.language);
    }
    repo.topics?.forEach(topic => topics.add(topic));
  });
  
  return [...languages, ...topics].sort();
}

/**
 * Fetch CV repository contents to extract skills
 */
async function fetchCVSkills() {
  try {
    console.log(`Fetching CV repository contents: ${USERNAME}/${CV_REPO}...`);
    const response = await fetch(
      `https://api.github.com/repos/${USERNAME}/${CV_REPO}/contents`,
      { headers }
    );
    
    if (!response.ok) {
      console.log('CV repository not found or not accessible');
      return [];
    }
    
    const contents = await response.json();
    
    // Look for .tex, .txt, or README.md files
    const relevantFiles = contents.filter(file => 
      file.name.endsWith('.tex') || 
      file.name.endsWith('.txt') || 
      file.name === 'README.md'
    );
    
    if (relevantFiles.length === 0) {
      console.log('No relevant files found in CV repository');
      return [];
    }
    
    console.log(`Found ${relevantFiles.length} relevant files in CV repository`);
    
    // Fetch content of first 3 files
    const fileContents = await Promise.all(
      relevantFiles.slice(0, 3).map(async (file) => {
        const fileResponse = await fetch(file.download_url);
        return fileResponse.text();
      })
    );
    
    const combinedText = fileContents.join('\n');
    
    // Simple skill extraction - look for common technology keywords
    const skillKeywords = [
      'Python', 'JavaScript', 'TypeScript', 'Java', 'C\\+\\+', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
      'React', 'Vue', 'Angular', 'Next\\.js', 'Node\\.js', 'Express', 'Django', 'Flask',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'Git', 'CI/CD', 'Linux', 'Terraform', 'GraphQL', 'REST', 'API'
    ];
    
    const foundSkills = new Set();
    
    skillKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(combinedText)) {
        // Normalize the skill name
        foundSkills.add(keyword.replace(/\\b/g, '').replace(/\\/g, ''));
      }
    });
    
    const skills = Array.from(foundSkills).sort();
    console.log(`Extracted ${skills.length} skills from CV`);
    return skills;
  } catch (error) {
    console.error('Error fetching CV skills:', error);
    return [];
  }
}

/**
 * Simple skill categorization based on common patterns
 */
function categorizeSkills(skills) {
  const languageKeywords = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'Scala'];
  const frontendKeywords = ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'sass', 'scss'];
  const backendKeywords = ['Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST'];
  const toolKeywords = ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Linux'];
  
  const categorized = {
    languages: [],
    frontend: [],
    backend: [],
    tools: [],
    other: []
  };
  
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    let categorizedFlag = false;
    
    if (languageKeywords.some(kw => kw.toLowerCase() === skillLower)) {
      categorized.languages.push(skill);
      categorizedFlag = true;
    }
    if (frontendKeywords.some(kw => kw.toLowerCase() === skillLower)) {
      categorized.frontend.push(skill);
      categorizedFlag = true;
    }
    if (backendKeywords.some(kw => kw.toLowerCase() === skillLower)) {
      categorized.backend.push(skill);
      categorizedFlag = true;
    }
    if (toolKeywords.some(kw => kw.toLowerCase() === skillLower)) {
      categorized.tools.push(skill);
      categorizedFlag = true;
    }
    
    if (!categorizedFlag) {
      categorized.other.push(skill);
    }
  });
  
  return categorized;
}

/**
 * Main function to fetch and save all data
 */
async function main() {
  console.log('Starting GitHub data fetch...');
  console.log(`Username: ${USERNAME}`);
  console.log(`Organization: ${ORG_NAME}`);
  console.log(`CV Repository: ${CV_REPO}`);
  
  try {
    // Fetch all data in parallel
    const [pinnedRepos, userRepos, orgRepos, cvSkills] = await Promise.all([
      fetchPinnedRepos(),
      fetchUserRepos(USERNAME),
      fetchOrgRepos(ORG_NAME),
      fetchCVSkills()
    ]);
    
    // Combine all repositories and remove duplicates
    const allRepos = [...userRepos, ...orgRepos];
    const uniqueRepos = allRepos.filter((repo, index, self) =>
      index === self.findIndex((r) => r.id === repo.id)
    );
    
    console.log(`Total unique repositories: ${uniqueRepos.length}`);
    
    // Extract skills from repositories
    const repoSkills = extractSkillsFromRepos(uniqueRepos);
    
    // Combine all skills and remove duplicates
    const allSkills = [...new Set([...cvSkills, ...repoSkills])].sort();
    console.log(`Total unique skills: ${allSkills.length}`);
    
    // Categorize skills
    const categorizedSkills = categorizeSkills(allSkills);
    
    // Build the final data structure
    const data = {
      lastUpdated: new Date().toISOString(),
      pinnedRepos: pinnedRepos,
      allRepos: uniqueRepos,
      skills: {
        all: allSkills,
        categorized: categorizedSkills
      },
      metadata: {
        username: USERNAME,
        orgName: ORG_NAME,
        totalRepos: uniqueRepos.length,
        pinnedRepos: pinnedRepos.length,
        totalSkills: allSkills.length
      }
    };
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write data to file
    const outputPath = path.join(dataDir, 'github-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Data successfully written to ${outputPath}`);
    console.log(`   - Pinned repos: ${pinnedRepos.length}`);
    console.log(`   - Total repos: ${uniqueRepos.length}`);
    console.log(`   - Total skills: ${allSkills.length}`);
    console.log(`   - Languages: ${categorizedSkills.languages.length}`);
    console.log(`   - Frontend: ${categorizedSkills.frontend.length}`);
    console.log(`   - Backend: ${categorizedSkills.backend.length}`);
    console.log(`   - Tools: ${categorizedSkills.tools.length}`);
    console.log(`   - Other: ${categorizedSkills.other.length}`);
    
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
