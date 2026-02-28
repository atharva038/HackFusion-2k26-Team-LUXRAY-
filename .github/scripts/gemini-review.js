// .github/scripts/gemini-review.js
// Fetches the PR diff, sends it to Gemini for review, and posts a PR comment.
// Runs in /tmp where @google/generative-ai and @octokit/rest are installed.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PR_NUMBER = parseInt(process.env.PR_NUMBER, 10);
const PR_TITLE = process.env.PR_TITLE || '';
const PR_BODY = process.env.PR_BODY || 'No description provided.';
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

// ── Validation ────────────────────────────────────────────────────────────────
if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not set');
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
if (!PR_NUMBER || isNaN(PR_NUMBER)) throw new Error('PR_NUMBER is not set or invalid');

// ── Clients ───────────────────────────────────────────────────────────────────
const octokit = new Octokit({ auth: GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── Fetch PR diff ─────────────────────────────────────────────────────────────
console.log(`Fetching diff for PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}...`);

const { data: files } = await octokit.pulls.listFiles({
  owner: REPO_OWNER,
  repo: REPO_NAME,
  pull_number: PR_NUMBER,
  per_page: 100,
});

// Build a readable diff, skip lock files and large generated assets
const SKIP_PATTERNS = [
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.min\.(js|css)$/,
  /dist\//,
  /build\//,
  /node_modules\//,
];

const shouldSkip = (filename) => SKIP_PATTERNS.some((p) => p.test(filename));

let diffContent = '';
let skippedFiles = [];

for (const file of files) {
  if (shouldSkip(file.filename)) {
    skippedFiles.push(file.filename);
    continue;
  }
  if (file.patch) {
    diffContent += `\n\n### \`${file.filename}\` (${file.status}, +${file.additions} -${file.deletions})\n\`\`\`diff\n${file.patch}\n\`\`\``;
  }
}

// Truncate to stay within Gemini's context window
const MAX_DIFF_CHARS = 28_000;
let truncated = false;
if (diffContent.length > MAX_DIFF_CHARS) {
  diffContent = diffContent.substring(0, MAX_DIFF_CHARS);
  truncated = true;
}

if (!diffContent.trim()) {
  console.log('No reviewable diff found (all files skipped or have no patch). Exiting.');
  process.exit(0);
}

// ── Build Gemini prompt ───────────────────────────────────────────────────────
const systemContext = `You are an expert code reviewer for HackFusion-2k26 Team LUXRAY — a MERN stack AI-powered pharmacy management system.
The stack includes: React 19 + Zustand + Tailwind (frontend), Express + MongoDB/Mongoose + Socket.IO + Redis + Cloudinary (backend), AI agents powered by OpenAI/Mistral.
This app handles sensitive medical data (prescriptions, patient info) and payment flows (Razorpay). Security is critical.`;

const prompt = `${systemContext}

Review the following pull request and provide clear, actionable feedback.

**PR #${PR_NUMBER}: ${PR_TITLE}**
**Description:** ${PR_BODY}
${truncated ? '\n> ⚠️ Diff was truncated to fit context limits. Review is based on the first ~28,000 characters.\n' : ''}
${skippedFiles.length ? `\n> ℹ️ Skipped files (lock files / build artifacts): ${skippedFiles.join(', ')}\n` : ''}

---
${diffContent}
---

Respond with a structured Markdown review using these sections:

## Summary
One or two sentences describing what this PR does.

## 🐛 Bugs & Errors
List any actual bugs or logic errors. If none, write "None found."

## 🔒 Security Issues
Flag anything that could compromise medical data, auth, payments, or inject vulnerabilities. If none, write "None found."

## ⚡ Performance
Identify any N+1 queries, missing indexes, unnecessary re-renders, or heavy operations. If none, write "None found."

## 💡 Suggestions
Concrete improvements to code quality, readability, or architecture (max 5 items).

## ✅ Verdict
One of: **LGTM** | **Needs Changes** | **Minor Suggestions**

Keep the review concise and developer-friendly.`;

// ── Call Gemini ───────────────────────────────────────────────────────────────
console.log('Sending diff to Gemini for review...');

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

let reviewText;
try {
  const result = await model.generateContent(prompt);
  reviewText = result.response.text();
} catch (err) {
  console.error('Gemini API error:', err.message);
  // Post a minimal comment so the workflow doesn't silently fail
  reviewText = `> ⚠️ Gemini review failed: \`${err.message}\`. Please review manually.`;
}

// ── Post comment on PR ────────────────────────────────────────────────────────
const commentBody = `## 🤖 Gemini AI Code Review

${reviewText}

---
<sub>Automated review by [Google Gemini](https://ai.google.dev/) · Powered by HackFusion CI</sub>`;

console.log('Posting review comment on PR...');

await octokit.issues.createComment({
  owner: REPO_OWNER,
  repo: REPO_NAME,
  issue_number: PR_NUMBER,
  body: commentBody,
});

console.log(`Review posted successfully on PR #${PR_NUMBER}.`);
