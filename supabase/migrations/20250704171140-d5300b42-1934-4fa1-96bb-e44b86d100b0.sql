
-- Create projects table for dynamic project management
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT NOT NULL,
    language TEXT,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add blog review workflow status
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
CREATE POLICY "Anyone can view projects" 
    ON public.projects 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage projects" 
    ON public.projects 
    FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert sample projects data
INSERT INTO public.projects (name, description, github_url, language, category, tags, stars, forks, featured) VALUES
('EthioRecon', 'Comprehensive reconnaissance tool tailored for Ethiopian networks and infrastructure.', 'https://github.com/yekolo-temari/ethio-recon', 'Python', 'Reconnaissance', ARRAY['Python', 'Network Scanning', 'OSINT'], 245, 67, true),
('AmharicPayloads', 'Collection of security payloads and wordlists with Amharic context for localized testing.', 'https://github.com/yekolo-temari/amharic-payloads', 'Text', 'Payloads', ARRAY['Wordlists', 'Payloads', 'Localization'], 156, 43, true),
('CTF-Challenges', 'Custom CTF challenges created by our community for training and competitions.', 'https://github.com/yekolo-temari/ctf-challenges', 'Multiple', 'Education', ARRAY['CTF', 'Challenges', 'Training'], 189, 78, false),
('VulnScanner-ET', 'Automated vulnerability scanner with Ethiopian banking and financial sector focus.', 'https://github.com/yekolo-temari/vulnscanner-et', 'Go', 'Scanning', ARRAY['Go', 'Vulnerability Scanner', 'Automation'], 324, 89, true),
('SecureAuth-Ethiopia', 'Multi-factor authentication library designed for Ethiopian mobile networks.', 'https://github.com/yekolo-temari/secureauth-ethiopia', 'JavaScript', 'Authentication', ARRAY['JavaScript', 'Authentication', 'Mobile'], 98, 23, false),
('PhishGuard-AM', 'Phishing detection and prevention tool with Amharic language support.', 'https://github.com/yekolo-temari/phishguard-am', 'Python', 'Security', ARRAY['Python', 'Phishing', 'ML'], 167, 34, false);
