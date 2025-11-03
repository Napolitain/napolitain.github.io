# Planning Guide

A portfolio website to showcase Napolitain's software engineering work, projects, and professional presence to potential employers, collaborators, and the developer community.

**Experience Qualities**:
1. **Professional** - Projects trust and competence through clean design and clear information hierarchy
2. **Modern** - Feels current and demonstrates awareness of contemporary web standards and aesthetics
3. **Personal** - Balances professionalism with personality, making the portfolio memorable and authentic

**Complexity Level**: Content Showcase (information-focused)
This is primarily an informational site focused on presenting projects, skills, and contact information clearly. It doesn't require complex state management or advanced functionality beyond smooth navigation and presentation.

## Essential Features

### GitHub Integration
- **Functionality**: Fetch and display pinned repositories from github.com/Napolitain
- **Purpose**: Showcase best work automatically without manual updates
- **Trigger**: On page load
- **Progression**: Load page → Fetch GitHub API → Display repos with name/description/stars/language
- **Success criteria**: Repos display with accurate data, graceful loading states, error handling for API failures

### Hero Section
- **Functionality**: Introduce visitor to who you are and what you do
- **Purpose**: Make strong first impression and communicate core value proposition
- **Trigger**: Page load
- **Progression**: Page loads → Hero animates in → Name/title/tagline visible → CTA button present
- **Success criteria**: Content is immediately readable, animation enhances without delaying, CTA is obvious

### Skills Display
- **Functionality**: Visual representation of technical skills and proficiencies
- **Purpose**: Quick overview of technical capabilities for recruiters and collaborators
- **Trigger**: Scroll into view
- **Progression**: User scrolls → Section enters viewport → Skills animate in with icons → Organized by category
- **Success criteria**: Skills are scannable, categorized logically, visually appealing

### Contact Section
- **Functionality**: Provide ways to get in touch (GitHub, email, LinkedIn, etc.)
- **Purpose**: Enable opportunities and connections
- **Trigger**: Scroll to bottom or click contact CTA
- **Progression**: User navigates to contact → Links displayed → User clicks link → Opens in appropriate context
- **Success criteria**: All links work, appropriate icons used, email/social handles accurate

## Edge Case Handling

- **GitHub API Failure**: Show placeholder message with link to GitHub profile directly
- **Slow Network**: Display skeleton loaders for GitHub repos section
- **No JavaScript**: Core content (name, bio, contact links) remains accessible
- **Mobile Viewport**: Single column layout, touch-friendly hit targets, readable text sizes
- **Long Project Descriptions**: Truncate with read more option or card expansion

## Design Direction

The design should feel modern, clean, and professional with subtle playfulness through micro-interactions. Think minimalist portfolio meets GitHub's design language - familiar to developers but elevated. A minimal interface serves the purpose best, letting the work speak for itself.

## Color Selection

Complementary (opposite colors) - Using a refined blue-purple as primary (developer/tech association) with warm orange accents for CTAs and highlights, creating visual interest and drawing attention to interactive elements.

- **Primary Color**: Deep Blue-Purple (oklch(0.35 0.15 275)) - Communicates professionalism, technical expertise, trust
- **Secondary Colors**: Soft gray tones (oklch(0.95 0.01 275)) for backgrounds, maintaining subtle color harmony with primary
- **Accent Color**: Warm Orange (oklch(0.65 0.18 45)) for CTAs, hover states, and important interactive elements - creates energy and draws the eye
- **Foreground/Background Pairings**: 
  - Background (Light Gray oklch(0.98 0.005 275)): Dark text (oklch(0.2 0.02 275)) - Ratio 13.5:1 ✓
  - Card (White oklch(1 0 0)): Dark text (oklch(0.2 0.02 275)) - Ratio 16.2:1 ✓
  - Primary (Blue-Purple oklch(0.35 0.15 275)): White text (oklch(0.98 0.005 275)) - Ratio 9.8:1 ✓
  - Accent (Warm Orange oklch(0.65 0.18 45)): White text (oklch(0.98 0.005 275)) - Ratio 4.9:1 ✓

## Font Selection

Typography should feel modern and technical yet approachable - using Inter for its excellent readability and contemporary feel that's widely adopted in tech products.

- **Typographic Hierarchy**:
  - H1 (Name): Inter Bold/48px (mobile: 36px)/tight leading (-0.02em letter-spacing)
  - H2 (Section Headers): Inter SemiBold/32px (mobile: 24px)/tight leading
  - H3 (Project Titles): Inter SemiBold/24px (mobile: 20px)/normal leading
  - Body (Descriptions): Inter Regular/16px/relaxed leading (1.6)
  - Small (Meta Info): Inter Medium/14px/normal leading

## Animations

Animations should be purposeful and subtle - enhancing the sense of quality without drawing attention away from content. Focus on micro-interactions that reward user exploration.

- **Purposeful Meaning**: Gentle fade-up animations communicate polish and care; hover states on project cards suggest interactivity
- **Hierarchy of Movement**: Hero section gets primary animation focus on load; project cards animate on scroll; CTAs have hover/press states

## Component Selection

- **Components**: 
  - Hero: Custom component with framer-motion for intro animation
  - Project Cards: `Card` component with custom styling, hover effects with scale transform
  - Skills: `Badge` components grouped in flex containers
  - Contact: `Button` components for CTAs, icons from phosphor-icons
  - Navigation: Custom sticky header with smooth scroll behavior

- **Customizations**: 
  - Card hover states with subtle lift (shadow increase, slight scale)
  - Custom gradient backgrounds in hero section
  - Animated skill badges that fade in on scroll

- **States**: 
  - Buttons: Subtle scale on press, background color shift on hover
  - Cards: Shadow expansion and scale (1.02) on hover
  - Links: Underline slide-in animation on hover

- **Icon Selection**: 
  - GithubLogo, LinkedinLogo, EnvelopeSimple for contact
  - ArrowRight for CTAs
  - Star, GitFork for repo stats
  - Code, Desktop, Database for skill categories

- **Spacing**: 
  - Section padding: py-24 (mobile: py-16)
  - Card gap: gap-6
  - Element spacing: space-y-4 for vertical stacks
  - Container max-width: max-w-6xl mx-auto px-6

- **Mobile**: 
  - Hero: Single column, centered text, reduced font sizes
  - Projects: Single column card layout (grid-cols-1)
  - Skills: Wrap badges naturally (flex-wrap)
  - Navigation: Simplified or hamburger if needed
  - Spacing: Reduced section padding (py-16 to py-12)
