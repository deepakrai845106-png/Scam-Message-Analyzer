// Scam Message Analyzer - Core Logic

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const messageInput = document.getElementById('messageInput');
    const countrySelect = document.getElementById('countrySelect');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsSection = document.getElementById('resultsSection');
    const scoreCircle = document.getElementById('scoreCircle');
    const scoreText = document.getElementById('scoreText');
    const resultBadge = document.getElementById('resultBadge');
    const riskLabel = document.getElementById('riskLabel');
    const scamReasonsList = document.getElementById('scamReasonsList');
    const highlightedKeywords = document.getElementById('highlightedKeywords');
    const charCount = document.getElementById('charCount');
    const themeToggle = document.getElementById('themeToggle');
    const currentYear = document.getElementById('currentYear');
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Theme Toggle
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Character count for textarea
    messageInput.addEventListener('input', function() {
        charCount.textContent = messageInput.value.length;
    });
    
    // FAQ functionality
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isActive = this.classList.contains('active');
            
            // Close all FAQ answers
            document.querySelectorAll('.faq-question').forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.classList.remove('active');
            });
            
            // If this wasn't active, open it
            if (!isActive) {
                this.classList.add('active');
                answer.classList.add('active');
            }
        });
    });
    
    // Clear button functionality
    clearBtn.addEventListener('click', function() {
        messageInput.value = '';
        charCount.textContent = '0';
        resultsSection.classList.add('hidden');
        messageInput.focus();
    });
    
    // Analyze button functionality
    analyzeBtn.addEventListener('click', function() {
        const message = messageInput.value.trim();
        const country = countrySelect.value;
        
        if (message.length === 0) {
            alert('Please paste a message to analyze!');
            messageInput.focus();
            return;
        }
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Analyze the message
        const analysis = analyzeMessage(message, country);
        
        // Update UI with results
        updateResultsUI(analysis);
        
        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    
    // Enter key to analyze
    messageInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeBtn.click();
        }
    });
    
    // Scam detection patterns and keywords
    const scamPatterns = {
        // General scam indicators
        urgencyPhrases: [
            'act now', 'immediately', 'within 24 hours', 'last chance', 'urgent', 'time sensitive',
            'expire soon', 'limited time', 'final notice', 'immediate action required', 'hurry',
            'quick response needed', 'deadline approaching', 'today only', 'instant'
        ],
        
        threatPhrases: [
            'account will be closed', 'legal action', 'suspended', 'blocked', 'terminated',
            'frozen', 'arrest warrant', 'lawsuit', 'police case', 'fine', 'penalty',
            'jail', 'court', 'investigation', 'security alert', 'compromise'
        ],
        
        rewardPhrases: [
            'you have won', 'congratulations', 'winner', 'prize', 'reward', 'gift card',
            'free gift', 'cash prize', 'lottery', 'jackpot', 'bonus', 'free money',
            'reward points', 'exclusive offer', 'special gift', 'bonanza'
        ],
        
        financialPhrases: [
            'bank account', 'credit card', 'debit card', 'upi', 'paytm', 'phonepe', 'google pay',
            'transaction', 'payment', 'refund', 'cashback', 'deposit', 'withdrawal', 'transfer',
            'money', 'funds', 'financial aid', 'loan', 'investment'
        ],
        
        personalInfoPhrases: [
            'password', 'pin', 'otp', 'one time password', 'verification code', 'security code',
            'aadhaar', 'pan card', 'social security', 'ssn', 'date of birth', 'dob', 'address',
            'mother maiden name', 'personal details', 'kyc', 'know your customer', 'update kyc'
        ],
        
        suspiciousLinks: [
            'http://', 'https://', 'bit.ly', 'tinyurl', 'short.link', 'click here', 'link',
            'website', 'portal', 'update now', 'verify here', 'claim now', 'secure link'
        ],
        
        jobScamPhrases: [
            'work from home', 'earn money', 'part time job', 'full time job', 'high salary',
            'no experience needed', 'easy work', 'daily payment', 'online job', 'data entry',
            'telegram', 'whatsapp job', 'google chat', 'recruitment', 'hiring', 'vacancy'
        ],
        
        fakeAuthorityPhrases: [
            'irs', 'income tax', 'usps', 'united states postal service', 'social security',
            'reserve bank of india', 'rbi', 'sebi', 'income tax department', 'trai', 'dot'
        ],
        
        // Country-specific patterns
        indiaSpecific: [
            'upi', 'paytm', 'phonepe', 'google pay', 'aadhaar', 'pan card', 'sim block',
            'jio', 'airtel', 'vi', 'bsnl', 'electricity bill', 'gas connection', 'lpg',
            'fastag', 'epf', 'provident fund', 'itr', 'income tax return', 'gst'
        ],
        
        usaSpecific: [
            'irs', 'internal revenue service', 'usps', 'social security', 'medicare',
            'medicaid', 'fbi', 'cia', 'homeland security', 'tax refund', 'stimulus check',
            'federal reserve', 'secret service', 'dea', 'atf'
        ]
    };
    
    // Analyze message function
    function analyzeMessage(message, country) {
        const lowerMessage = message.toLowerCase();
        const analysis = {
            score: 0,
            riskLevel: 'safe',
            reasons: [],
            keywords: []
        };
        
        let riskPoints = 0;
        const maxPoints = 100;
        
        // Check for each scam pattern
        Object.keys(scamPatterns).forEach(pattern => {
            scamPatterns[pattern].forEach(keyword => {
                // Use regex for word boundaries to avoid partial matches
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = lowerMessage.match(regex);
                
                if (matches) {
                    // Add keyword to found list
                    if (!analysis.keywords.includes(keyword)) {
                        analysis.keywords.push(keyword);
                    }
                    
                    // Add risk points based on pattern type
                    let points = 0;
                    
                    if (pattern === 'urgencyPhrases') points = 8;
                    else if (pattern === 'threatPhrases') points = 10;
                    else if (pattern === 'rewardPhrases') points = 7;
                    else if (pattern === 'financialPhrases') points = 9;
                    else if (pattern === 'personalInfoPhrases') points = 12;
                    else if (pattern === 'suspiciousLinks') points = 15;
                    else if (pattern === 'jobScamPhrases') points = 8;
                    else if (pattern === 'fakeAuthorityPhrases') points = 11;
                    else if (pattern === 'indiaSpecific' && country === 'india') points = 10;
                    else if (pattern === 'usaSpecific' && country === 'usa') points = 10;
                    else points = 5;
                    
                    riskPoints += points * matches.length;
                    
                    // Add reason if not already added for this pattern type
                    const reasonText = getReasonText(pattern, keyword, country);
                    if (!analysis.reasons.includes(reasonText)) {
                        analysis.reasons.push(reasonText);
                    }
                }
            });
        });
        
        // Check for unrealistic amounts (like $500/day)
        const amountPatterns = [
            /\$\d{3,}(\s*\/\s*(day|daily|month|week))/gi,  // $500/day
            /₹\d{5,}(\s*\/\s*(day|daily|month|week))/gi,   // ₹50000/day
            /\d{4,}\s*(dollars|usd|rupees|inr)(\s*\/\s*(day|daily|month|week))/gi
        ];
        
        amountPatterns.forEach(pattern => {
            if (pattern.test(message)) {
                riskPoints += 15;
                analysis.keywords.push('unrealistic amount');
                analysis.reasons.push('Unrealistically high salary or reward amount mentioned');
            }
        });
        
        // Check for phone numbers and email addresses (could be contact for scams)
        const contactPatterns = [
            /\b\d{10}\b/g,  // Phone numbers
            /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/gi  // Email addresses
        ];
        
        contactPatterns.forEach(pattern => {
            const matches = message.match(pattern);
            if (matches && matches.length > 1) {  // Multiple contact methods
                riskPoints += 8;
                analysis.keywords.push('multiple contacts');
                analysis.reasons.push('Multiple contact methods provided (common in scams)');
            }
        });
        
        // Check message length (very short messages are suspicious)
        if (message.length < 50) {
            riskPoints += 5;
            analysis.reasons.push('Very short message (scams often use brief, urgent messages)');
        }
        
        // Check for excessive punctuation (common in scam messages)
        const exclamationCount = (message.match(/!/g) || []).length;
        if (exclamationCount > 3) {
            riskPoints += 6;
            analysis.keywords.push('excessive punctuation');
            analysis.reasons.push('Excessive use of exclamation marks (common in scam messages)');
        }
        
        // Cap risk points at max
        riskPoints = Math.min(riskPoints, maxPoints);
        
        // Calculate score (0-100, higher = more risky)
        analysis.score = Math.round((riskPoints / maxPoints) * 100);
        
        // Determine risk level
        if (analysis.score >= 70) {
            analysis.riskLevel = 'high-risk';
        } else if (analysis.score >= 30) {
            analysis.riskLevel = 'suspicious';
        } else {
            analysis.riskLevel = 'safe';
        }
        
        // If no specific reasons found but score is high, add generic reason
        if (analysis.reasons.length === 0 && analysis.score > 40) {
            analysis.reasons.push('Message contains multiple suspicious patterns commonly found in scams');
        }
        
        // Limit reasons to 5 most relevant
        analysis.reasons = analysis.reasons.slice(0, 5);
        
        return analysis;
    }
    
    // Get readable reason text for a pattern
    function getReasonText(pattern, keyword, country) {
        const reasons = {
            urgencyPhrases: 'Urgency language used to pressure quick action',
            threatPhrases: 'Threatening language suggesting negative consequences',
            rewardPhrases: 'Unrealistic reward or prize offer',
            financialPhrases: 'Mentions of financial transactions or accounts',
            personalInfoPhrases: 'Request for personal information or verification codes',
            suspiciousLinks: 'Contains suspicious links or URLs',
            jobScamPhrases: 'Features common job scam indicators',
            fakeAuthorityPhrases: 'Claims to be from an official authority or organization',
            indiaSpecific: `India-specific scam pattern detected (${keyword})`,
            usaSpecific: `USA-specific scam pattern detected (${keyword})`
        };
        
        return reasons[pattern] || `Suspicious keyword detected: "${keyword}"`;
    }
    
    // Update UI with analysis results
    function updateResultsUI(analysis) {
        // Update score circle
        const circumference = 2 * Math.PI * 54; // r=54
        const offset = circumference - (analysis.score / 100) * circumference;
        scoreCircle.style.strokeDashoffset = offset;
        scoreText.textContent = analysis.score;
        
        // Update badge and risk label
        resultBadge.className = 'result-badge ' + analysis.riskLevel;
        
        const badgeConfig = {
            'high-risk': { icon: '🔴', text: 'High Risk Scam', color: 'var(--high-risk-color)' },
            'suspicious': { icon: '🟡', text: 'Suspicious', color: 'var(--suspicious-color)' },
            'safe': { icon: '🟢', text: 'Likely Safe', color: 'var(--safe-color)' }
        };
        
        const config = badgeConfig[analysis.riskLevel];
        resultBadge.innerHTML = `<span class="badge-icon">${config.icon}</span><span class="badge-text">${config.text}</span>`;
        resultBadge.style.borderColor = config.color;
        
        riskLabel.textContent = `Risk Level: ${config.text}`;
        scoreCircle.style.stroke = config.color;
        
        // Update scam reasons
        scamReasonsList.innerHTML = '';
        if (analysis.reasons.length > 0) {
            analysis.reasons.forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                scamReasonsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No specific scam indicators detected. Message appears safe.';
            scamReasonsList.appendChild(li);
        }
        
        // Update highlighted keywords
        highlightedKeywords.innerHTML = '';
        if (analysis.keywords.length > 0) {
            analysis.keywords.slice(0, 15).forEach(keyword => {
                const span = document.createElement('span');
                span.className = 'keyword';
                span.textContent = keyword;
                highlightedKeywords.appendChild(span);
            });
        } else {
            const span = document.createElement('span');
            span.className = 'keyword';
            span.textContent = 'No suspicious keywords found';
            highlightedKeywords.appendChild(span);
        }
        
        // Add sample message if empty for demo
        if (messageInput.value.trim() === '') {
            const sampleMessages = [
                "Congratulations! You've won a $1000 Amazon gift card. Click here to claim: http://fake-gift.com/claim",
                "URGENT: Your bank account will be blocked in 24 hours. Update your KYC now: http://fake-bank-update.com",
                "Hi, we have a work-from-home job offer paying $500/day. Contact us on Telegram: @fakejob"
            ];
            messageInput.value = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
            charCount.textContent = messageInput.value.length;
        }
    }
    
    // Pre-load with a sample message for demo purposes
    window.addEventListener('load', function() {
        // Set a sample message after a short delay
        setTimeout(() => {
            if (messageInput.value.trim() === '') {
                const sampleMessage = "Congratulations! You've won a $1000 Amazon gift card. Click here to claim your prize immediately: http://win-gift.com/claim\n\nThis offer expires in 24 hours. Hurry!";
                messageInput.value = sampleMessage;
                charCount.textContent = sampleMessage.length;
            }
        }, 500);
    });
});