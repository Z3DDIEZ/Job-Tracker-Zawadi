import { JobApplication, ApplicationStatus, TagCategory } from '../types';

const COMPANIES = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'SpaceX', 'Spotify', 'Twitter',
    'Airbnb', 'Uber', 'Lyft', 'Stripe', 'Square', 'Shopify', 'Adobe', 'Salesforce', 'Oracle', 'IBM',
    'Intel', 'AMD', 'Nvidia', 'Samsung', 'Sony', 'Nintendo', 'Coinbase', 'Robinhood', 'DoorDash', 'Instacart',
    'Discord', 'Slack', 'Zoom', 'Atlassian', 'Dropbox', 'Box', 'Figma', 'Canva', 'Notion', 'Linear',
    'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Cloudflare', 'Fastly', 'Twilio', 'SendGrid', 'Auth0', 'Okta'
];

const ROLES = [
    'Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Frontend Engineer', 'Backend Engineer',
    'Full Stack Engineer', 'Mobile Engineer', 'iOS Engineer', 'Android Engineer', 'DevOps Engineer',
    'Site Reliability Engineer', 'Cloud Engineer', 'Security Engineer', 'Data Engineer', 'Machine Learning Engineer',
    'AI Researcher', 'Product Manager', 'Product Designer', 'UI/UX Designer', 'Data Scientist', 'Data Analyst',
    'Engineering Manager', 'Tech Lead', 'Solutions Architect', 'Developer Advocate'
];

const STATUSES: ApplicationStatus[] = [
    'Applied', 'Applied', 'Applied', 'Applied', // Weighted towards applied
    'Phone Screen', 'Phone Screen',
    'Technical Interview', 'Technical Interview',
    'Final Round',
    'Offer',
    'Rejected', 'Rejected', 'Rejected'
];

const TAGS = [
    'Remote', 'Hybrid', 'On-site', 'Startup', 'Enterprise', 'FAANG', 'Fintech',
    'Healthtech', 'Edtech', 'E-commerce', 'Crypto', 'AI/ML', 'SaaS', 'B2B', 'B2C',
    'High Salary', 'Equity', 'Great Benefits', 'Visa Sponsorship', 'Cool Culture'
];

const CATEGORIES: TagCategory[] = ['industry', 'role-type', 'company-size', 'location', 'seniority', 'remote-work'];

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomItems<T>(arr: T[], count: number): T[] {
    const shuffled = arr.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

export function generateDemoData(count: number = 100): JobApplication[] {
    const apps: JobApplication[] = [];
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    for (let i = 0; i < count; i++) {
        const company = randomItem(COMPANIES) as string;
        const role = randomItem(ROLES);
        // Use non-null assertion as toISOString will return a string
        const dateApplied = randomDate(sixMonthsAgo, now).toISOString().split('T')[0]!;
        const status = randomItem(STATUSES);

        // Logic to make status timeline somewhat realistic relative to date
        // e.g. very recent applications shouldn't be 'Rejected' or 'Offer' too often unless fast process
        // but for simple demo data, random is usually fine.

        const app: JobApplication = {
            id: `demo-${i}-${Date.now()}`,
            company,
            role,
            dateApplied, // Is string
            status,
            visaSponsorship: Math.random() > 0.7, // 30% chance
            timestamp: Date.now(),
            tags: Math.random() > 0.5 ?
                randomItems(TAGS, Math.floor(Math.random() * 3) + 1).map(name => ({
                    id: `tag-${name}`,
                    name,
                    color: '#e2e8f0',
                    category: randomItem(CATEGORIES)
                })) : undefined
        };

        apps.push(app);
    }

    return apps.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
}
