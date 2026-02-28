// AI Provider Data and Keywords (Defaults)
const defaultProvidersInfo = {
    Claude: {
        name: "Claude",
        url: "https://claude.ai/new",
        color: "var(--claude-color)",
        keywords: ["write", "code", "debug", "refactor", "explain", "essay", "document", "step by step", "architecture"],
        reason: "Claude excels at coding, complex reasoning, and long-form writing with nuance.",
        runnerUpText: "Claude is also strong here if you need deep, multi-step technical reasoning or coding help."
    },
    Gemini: {
        name: "Gemini",
        url: "https://gemini.google.com/app",
        color: "#8ab4f8",
        keywords: ["research", "analyze", "document", "pdf", "find", "sources", "compare", "academic", "data", "summarize this file"],
        reason: "Gemini is unmatched for research across large documents, live sources, and Google Workspace.",
        runnerUpText: "Gemini is also an excellent choice here if you're working with uploaded files or live web data."
    },
    Grok: {
        name: "Grok",
        url: "https://grok.com",
        color: "var(--grok-color)",
        keywords: ["trending", "latest", "news", "today", "what happened", "twitter", "x", "social media", "viral", "sentiment", "people saying"],
        reason: "Grok has real-time access to X data, making it the best for current events and social trends.",
        runnerUpText: "Grok might provide a valuable alternative here if you are looking for unfiltered, real-time social sentiment."
    },
    ChatGPT: {
        name: "ChatGPT",
        url: "https://chatgpt.com",
        color: "var(--chatgpt-color)",
        keywords: ["i feel", "help me decide", "what should i", "voice", "remember", "personal", "strategy", "business", "image", "generate a picture"],
        reason: "ChatGPT is highly versatile, with a great voice for personal advice, strategy, and multimodal generation.",
        runnerUpText: "ChatGPT is also highly capable here if you value conversational flow and brainstorming."
    }
};

// Active providers object (loaded from storage or defaults)
let providers = JSON.parse(JSON.stringify(defaultProvidersInfo));


const promptInput = document.getElementById('promptInput');
const routeBtn = document.getElementById('routeBtn');
const resultSection = document.getElementById('resultSection');
const recommendationCard = document.getElementById('recommendationCard');
const winnerName = document.getElementById('winnerName');
const winnerReason = document.getElementById('winnerReason');
const secondaryRecommendation = document.getElementById('secondaryRecommendation');
const confidenceBadge = document.getElementById('confidenceBadge');
const confidenceText = document.getElementById('confidenceText');
const toast = document.getElementById('toast');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const toastMsg = document.getElementById('toastMsg');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const settingsForm = document.getElementById('settingsForm');

// Check Local Storage
function loadProviders() {
    const savedRules = localStorage.getItem('aiRouterKeywords');
    if (savedRules) {
        try {
            const customKeywords = JSON.parse(savedRules);
            // Merge custom keywords into providers object
            for (const [key, words] of Object.entries(customKeywords)) {
                if (providers[key]) {
                    providers[key].keywords = words;
                }
            }
        } catch (e) {
            console.error("Error loading router rules:", e);
        }
    }
}

// Initialize early constraints
loadProviders();

let lastAnalysisResult = null;
let isAnalyzed = false;

const shortcutHint = document.getElementById('shortcutHint');

// Check platform for hint
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const metaKeyName = isMac ? 'Cmd' : 'Ctrl';

function updateCmdHint(analyzed) {
    if (analyzed) {
        shortcutHint.innerHTML = `
             <span class="kbd">Enter</span> to route, or
             <span class="kbd">${metaKeyName}</span> + <span class="kbd">Enter</span> to route
         `;
    } else {
        shortcutHint.innerHTML = `
             <span class="kbd">Enter</span> to analyze
         `;
    }
}

updateCmdHint(false); // Init

// Reset analysis state when typing
promptInput.addEventListener('input', () => {
    if (isAnalyzed) {
        isAnalyzed = false;
        routeBtn.textContent = 'Analyze';
        updateCmdHint(false);
    }
});

// Event Listeners
routeBtn.addEventListener('click', () => {
    if (!isAnalyzed) {
        analyzePrompt();
    } else if (lastAnalysisResult) {
        openProvider(lastAnalysisResult, providers[lastAnalysisResult].url);
    }
});

promptInput.addEventListener('keydown', (e) => {
    // Shift + Enter -> default behavior (newline)
    if (e.shiftKey && e.key === 'Enter') {
        return; // Let it add a newline naturally
    }

    // Cmd/Ctrl + Enter -> Route instantly
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzePrompt();
        if (lastAnalysisResult) {
            openProvider(lastAnalysisResult, providers[lastAnalysisResult].url);
        }
        return;
    }

    // Enter alone -> Analyze first, then route on second press
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent newline

        if (!isAnalyzed) {
            analyzePrompt();
        } else if (lastAnalysisResult) {
            openProvider(lastAnalysisResult, providers[lastAnalysisResult].url);
        }
    }
});

// Settings Event Listeners
openSettingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', saveSettings);
resetSettingsBtn.addEventListener('click', resetSettings);

// Close modal when clicking outside content
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

function populateSettingsForm() {
    settingsForm.innerHTML = '';

    for (const [key, data] of Object.entries(providers)) {
        const settingDiv = document.createElement('div');
        settingDiv.className = 'provider-setting';

        const keywordsStr = data.keywords.join(', ');

        settingDiv.innerHTML = `
            <label for="kw-${key}">
                <span class="provider-badge-indicator" style="background: ${data.color}"></span>
                ${data.name} Keywords
            </label>
            <textarea id="kw-${key}" spellcheck="false">${keywordsStr}</textarea>
            <span class="setting-help">Rules matching these will route to ${data.name}</span>
        `;

        settingsForm.appendChild(settingDiv);
    }
}

function openSettings() {
    populateSettingsForm();
    settingsModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeSettings() {
    settingsModal.classList.remove('show');
    document.body.style.overflow = '';
}

function saveSettings() {
    const customRules = {};

    for (const key of Object.keys(providers)) {
        const textarea = document.getElementById(`kw-${key}`);
        if (textarea) {
            // Extract words, trim whitespace, remove empty items
            const rawWords = textarea.value.split(',');
            const cleanWords = rawWords
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length > 0);

            customRules[key] = cleanWords;
            providers[key].keywords = cleanWords; // Update active state
        }
    }

    localStorage.setItem('aiRouterKeywords', JSON.stringify(customRules));
    closeSettings();
    toastMsg.textContent = "Routing rules saved!";
    showToast();

    // Re-analyze prompt if there is one
    if (promptInput.value.trim().length > 0) {
        analyzePrompt();
    }
}

function resetSettings() {
    if (confirm("Are you sure you want to restore the default keywords?")) {
        localStorage.removeItem('aiRouterKeywords');
        // Deep copy defaults back over
        providers = JSON.parse(JSON.stringify(defaultProvidersInfo));
        populateSettingsForm();
        toastMsg.textContent = "Default rules restored!";
        showToast();
    }
}

function analyzePrompt() {
    const promptText = promptInput.value.trim();
    if (!promptText) return;

    const textLower = promptText.toLowerCase();
    let scores = { Claude: 0, Gemini: 0, Grok: 0, ChatGPT: 0 };
    let totalScore = 0;

    // Simple keyword matching score
    for (const [providerKey, providerData] of Object.entries(providers)) {
        if (!providerData.keywords) continue;
        providerData.keywords.forEach(keyword => {
            // Check if keyword is in text
            if (textLower.includes(keyword.toLowerCase())) {
                scores[providerKey] += 1;
                totalScore += 1;
            }
        });
    }

    // Convert map to sorted array
    const sortedProviders = Object.keys(scores).map(key => ({
        key,
        score: scores[key],
        data: providers[key]
    })).sort((a, b) => b.score - a.score);

    let winnerKey = sortedProviders[0].key;
    let winnerScore = sortedProviders[0].score;
    let runnerUpKey = sortedProviders[1].key;
    let runnerUpScore = sortedProviders[1].score;

    let confidenceStr = "Low";
    let confidenceClass = "confidence-low";
    let secondaryReason = "";
    let primaryReason = providers[winnerKey].reason;

    // Tie-Breaking Logic
    if (winnerScore === runnerUpScore && winnerScore > 0) {
        // We have a tie among the top scorers. Check all tied candidates. //
        const topScorers = sortedProviders.filter(p => p.score === winnerScore).map(p => p.key);

        // Tie-breaking rules in order of precedence:
        if (topScorers.includes('Claude') && (textLower.includes('code') || textLower.includes('debug') || textLower.includes('complex'))) {
            winnerKey = 'Claude';
        } else if (topScorers.includes('Gemini') && (textLower.includes('research') || textLower.includes('pdf') || textLower.includes('document') || textLower.includes('large'))) {
            winnerKey = 'Gemini';
        } else if (topScorers.includes('Grok') && (textLower.includes('news') || textLower.includes('latest') || textLower.includes('today') || textLower.includes('twitter'))) {
            winnerKey = 'Grok';
        } else if (topScorers.includes('ChatGPT')) {
            winnerKey = 'ChatGPT'; // Default tie-breaker fallback
        } else {
            winnerKey = topScorers[0]; // Pure alpha fallback
        }

        // Set the runner up to the one that lost the tie-break
        runnerUpKey = topScorers.find(k => k !== winnerKey) || runnerUpKey;
    }

    // Overwrite if no keywords matched at all
    if (totalScore === 0) {
        confidenceStr = "Best Guess";
        winnerKey = "Claude"; // Default for generic prompts
        runnerUpKey = "ChatGPT";
        primaryReason = "No specific routing keywords found. Defaulting to Claude as a highly versatile general-purpose assistant.";
        secondaryReason = "ChatGPT is also a great all-around fallback option.";
    } else {
        // Standard confidence logic
        if (winnerScore >= runnerUpScore * 2 && runnerUpScore > 0) {
            confidenceStr = "Strong Match";
            confidenceClass = "confidence-high";
            primaryReason = providers[winnerKey].reason;
            // No secondary recommendation needed for a strong match
        } else if (winnerScore >= (runnerUpScore * 1.2) && runnerUpScore > 0) {
            confidenceStr = "Good Match";
            confidenceClass = "confidence-medium";
            primaryReason = providers[winnerKey].reason;
            secondaryReason = providers[runnerUpKey].runnerUpText;
        } else {
            confidenceStr = "Best Guess";
            confidenceClass = "confidence-low";
            primaryReason = `Scores were very close between ${providers[winnerKey].name} and ${providers[runnerUpKey].name}. We've recommended ${providers[winnerKey].name} based on tie-breakers.`;
            secondaryReason = providers[runnerUpKey].runnerUpText;
        }
    }

    isAnalyzed = true;
    lastAnalysisResult = winnerKey;

    // Update UI Button semantics
    routeBtn.textContent = `Route to ${providers[winnerKey].name} ↗`;
    updateCmdHint(true);

    displayResults(winnerKey, confidenceStr, confidenceClass, primaryReason, secondaryReason);
    saveToHistory(promptText, winnerKey);
}

function displayResults(winnerKey, confidenceLabel, confidenceClass, customReason, customSecondaryReason) {
    const winner = providers[winnerKey];

    // Update UI
    winnerName.textContent = winner.name;
    winnerReason.textContent = customReason;

    if (customSecondaryReason) {
        secondaryRecommendation.textContent = customSecondaryReason;
        secondaryRecommendation.style.display = 'block';
    } else {
        secondaryRecommendation.style.display = 'none';
    }

    confidenceText.textContent = confidenceLabel;
    confidenceBadge.className = `confidence-badge ${confidenceClass}`;

    // Update card top border color
    recommendationCard.style.borderTopColor = winner.color;

    // Reset provider buttons
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.classList.remove('recommended');
    });

    // Highlight recommended (ensure DOM is updated)
    document.getElementById(`btn-${winnerKey.toLowerCase()}`).classList.add('recommended');

    // Show result section with animation trigger
    resultSection.style.display = 'block';
    resultSection.style.animation = 'none';
    void resultSection.offsetWidth; /* trigger reflow */
    resultSection.style.animation = 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';
}

async function openProvider(providerName, url) {
    const promptText = promptInput.value.trim();
    if (promptText) {
        try {
            await navigator.clipboard.writeText(promptText);
            showToast();
        } catch (err) {
            console.error('Failed to copy text. Fallback starting:', err);
            fallbackCopyTextToClipboard(promptText);
        }
    }

    // Open provider in new window/tab after a short delay
    // Let the user see the toast before leaving the page context if possible
    setTimeout(() => {
        window.open(url, '_blank');
    }, 300);
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast();
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        // Optional: reset message text after fading out
        setTimeout(() => {
            if (!toast.classList.contains('show')) {
                toastMsg.textContent = "Prompt copied to clipboard!";
            }
        }, 400);
    }, 3000);
}

function saveToHistory(prompt, provider) {
    let history = JSON.parse(localStorage.getItem('aiRouterHistory') || '[]');

    // Remove if already exists to put it at the top
    history = history.filter(item => item.prompt !== prompt);

    history.unshift({ prompt, provider, timestamp: Date.now() });

    // Keep only last 5
    if (history.length > 5) {
        history = history.slice(0, 5);
    }

    localStorage.setItem('aiRouterHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('aiRouterHistory') || '[]');

    if (history.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    historySection.style.display = 'block';
    historyList.innerHTML = '';

    history.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.onclick = () => loadHistoryItem(item.prompt, item.provider);

        el.innerHTML = `
            <div class="history-text">${escapeHtml(item.prompt)}</div>
            <div class="history-provider">${item.provider}</div>
        `;

        historyList.appendChild(el);
    });
}

function loadHistoryItem(prompt) {
    promptInput.value = prompt;
    analyzePrompt();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize history on load
renderHistory();
