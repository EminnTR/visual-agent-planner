// Pre-cached example results for instant demos (no API call needed)
// Each preset matches the shape returned by suggestAgentTeam()
// Items are hand-picked from catalog.json for maximum relevance

const PRESETS = [
    {
        prompt: 'AI travel planner with interactive maps',
        result: {
            selected: {
                agents: [
                    { id: 'api-architect', name: 'api-architect', description: 'Your role is that of an API architect. Help mentor the engineer by providing guidance, support, and working code.', category: 'api-graphql', installCmd: '--agent api-graphql/api-architect' },
                    { id: 'search-specialist', name: 'search-specialist', description: 'Expert web researcher using advanced search techniques and synthesis. Masters search operators, result filtering, and multi-source verification.', category: 'ai-specialists', installCmd: '--agent ai-specialists/search-specialist' },
                    { id: 'product-strategist', name: 'product-strategist', description: 'Product strategy and roadmap planning specialist. Use PROACTIVELY for product positioning, market analysis, feature prioritization.', category: 'business-marketing', installCmd: '--agent business-marketing/product-strategist' },
                ],
                commands: [
                    { id: 'optimize-api-performance', name: 'Optimize API Performance', description: 'Comprehensive API performance optimization with response time reduction, throughput improvement, and scalability.', category: 'performance', installCmd: '--command performance/optimize-api-performance' },
                    { id: 'architecture-review', name: 'Architecture Review', description: 'Comprehensive architecture review with design patterns analysis and improvement recommendations.', category: 'team', installCmd: '--command team/architecture-review' },
                ],
                hooks: [
                    { id: 'build-on-change', name: 'Build On Change', description: 'Automatically trigger build processes when source files change. Detects common build tools and runs appropriate build commands.', category: 'automation', installCmd: '--hook automation/build-on-change' },
                ],
                mcps: [
                    { id: 'github-integration', name: 'Github Integration', description: 'Direct GitHub API integration for repository management, issue tracking, pull requests, and collaborative development.', category: 'integration', installCmd: '--mcp integration/github-integration' },
                ],
                settings: [],
                skills: [
                    { id: 'react-best-practices', name: 'react-best-practices', description: 'Comprehensive React and Next.js performance optimization guide with 40+ rules for eliminating waterfalls, optimizing renders.', category: 'web-development', installCmd: '--skill web-development/react-best-practices' },
                    { id: 'web-performance-optimization', name: 'web-performance-optimization', description: 'Optimize website and web application performance including loading speed, Core Web Vitals, bundle size, caching.', category: 'web-development', installCmd: '--skill web-development/web-performance-optimization' },
                ],
            },
            summary: 'Selected 3 agents, 2 commands, 1 hook, 1 MCP, 2 skills for your AI travel planner project',
        },
    },
    {
        prompt: 'E-commerce store with AI recommendations',
        result: {
            selected: {
                agents: [
                    { id: 'backend-architect', name: 'backend-architect', description: 'Backend system architecture and API design specialist. Use PROACTIVELY for RESTful APIs, microservice boundaries, and system design.', category: 'development-team', installCmd: '--agent development-team/backend-architect' },
                    { id: 'payment-integration', name: 'payment-integration', description: 'Payment systems integration specialist. Use PROACTIVELY for Stripe, PayPal, and payment processor implementations.', category: 'business-marketing', installCmd: '--agent business-marketing/payment-integration' },
                    { id: 'database-architect', name: 'database-architect', description: 'Database architecture and design specialist. Use PROACTIVELY for database design decisions, data modeling, scalability planning.', category: 'database', installCmd: '--agent database/database-architect' },
                ],
                commands: [
                    { id: 'implement-caching-strategy', name: 'Implement Caching Strategy', description: 'Design and implement comprehensive caching solutions for improved performance and scalability.', category: 'performance', installCmd: '--command performance/implement-caching-strategy' },
                    { id: 'code-review', name: 'Code Review', description: 'Comprehensive code quality review with security, performance, and architecture analysis.', category: 'utilities', installCmd: '--command utilities/code-review' },
                ],
                hooks: [
                    { id: 'dependency-checker', name: 'Dependency Checker', description: 'Advanced dependency analysis and security checking. Monitors for outdated packages and security vulnerabilities.', category: 'automation', installCmd: '--hook automation/dependency-checker' },
                ],
                mcps: [
                    { id: 'stripe', name: 'Stripe', description: 'Let your AI agents interact with the Stripe API by using our MCP server.', category: 'devtools', installCmd: '--mcp devtools/stripe' },
                ],
                settings: [],
                skills: [
                    { id: 'web-performance-optimization', name: 'web-performance-optimization', description: 'Optimize website and web application performance including loading speed, Core Web Vitals, bundle size, caching.', category: 'web-development', installCmd: '--skill web-development/web-performance-optimization' },
                ],
            },
            summary: 'Selected 3 agents, 2 commands, 1 hook, 1 MCP, 1 skill for your E-commerce store project',
        },
    },
    {
        prompt: 'Mobile fitness app with social features',
        result: {
            selected: {
                agents: [
                    { id: 'backend-architect', name: 'backend-architect', description: 'Backend system architecture and API design specialist. Use PROACTIVELY for RESTful APIs, microservice boundaries, and system design.', category: 'development-team', installCmd: '--agent development-team/backend-architect' },
                    { id: 'database-architect', name: 'database-architect', description: 'Database architecture and design specialist. Use PROACTIVELY for database design decisions, data modeling, scalability planning.', category: 'database', installCmd: '--agent database/database-architect' },
                    { id: 'product-manager', name: 'product-manager', description: 'Product management and feature prioritization specialist.', category: 'business-marketing', installCmd: '--agent business-marketing/product-manager' },
                ],
                commands: [
                    { id: 'create-feature', name: 'Create Feature', description: 'Scaffold new feature with boilerplate code, tests, and documentation.', category: 'project-management', installCmd: '--command project-management/create-feature' },
                    { id: 'setup-ci-cd-pipeline', name: 'Setup CI/CD Pipeline', description: 'Setup comprehensive CI/CD pipeline with automated testing, deployment, and monitoring.', category: 'setup', installCmd: '--command setup/setup-ci-cd-pipeline' },
                ],
                hooks: [
                    { id: 'simple-notifications', name: 'Simple Notifications', description: 'Send simple desktop notifications when Claude Code operations complete.', category: 'automation', installCmd: '--hook automation/simple-notifications' },
                ],
                mcps: [
                    { id: 'sentry', name: 'Sentry', description: 'Sentry MCP for interacting with error tracking, focused on human-in-the-loop debugging workflows.', category: 'devtools', installCmd: '--mcp devtools/sentry' },
                ],
                settings: [],
                skills: [
                    { id: 'github-workflow-automation', name: 'github-workflow-automation', description: 'Automate GitHub workflows with AI assistance. Includes PR reviews, issue triage, CI/CD integration, and Git operations.', category: 'workflow-automation', installCmd: '--skill workflow-automation/github-workflow-automation' },
                ],
            },
            summary: 'Selected 3 agents, 2 commands, 1 hook, 1 MCP, 1 skill for your Mobile fitness app project',
        },
    },
];

export default PRESETS;
