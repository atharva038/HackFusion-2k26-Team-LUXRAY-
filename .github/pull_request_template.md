## Description
<!-- A clear and concise summary of what this PR does and why. -->



## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to break)
- [ ] Refactor / code cleanup (no functional change)
- [ ] Performance improvement
- [ ] Docs / comments only
- [ ] CI / configuration change

## Related Issue(s)
<!-- Link any related issues: Closes #123, Fixes #456 -->
Closes #

## Affected Area(s)
<!-- Check all that apply -->
- [ ] Frontend (React / Zustand / UI)
- [ ] Backend API (Express / routes / controllers)
- [ ] AI Agent / Chat
- [ ] Prescription / OCR
- [ ] Orders & Inventory
- [ ] Payment (Razorpay)
- [ ] Admin Panel
- [ ] Socket.IO / Real-time
- [ ] Auth / JWT
- [ ] Screen Recording
- [ ] Notifications
- [ ] CI / GitHub Actions
- [ ] Documentation

## How Has This Been Tested?
<!-- Describe the tests you ran and how to reproduce them. -->
- [ ] Manual testing (describe below)
- [ ] Existing tests pass (`npm test` in backend)
- [ ] New tests added

**Test steps:**
1.
2.

## Security Checklist
<!-- This app handles medical data and payments — please verify. -->
- [ ] No secrets / API keys are hardcoded or committed
- [ ] User input is validated / sanitised before DB/API calls
- [ ] Auth (`protect` middleware) applied to all new protected routes
- [ ] No sensitive patient data is logged to console in production paths
- [ ] Razorpay webhook signature is verified (if payment changes)

## Screenshots / Recordings
<!-- For UI changes, attach before/after screenshots or a short screen recording. -->



## Additional Notes
<!-- Anything else reviewers should know? Breaking migrations, env vars needed, etc. -->

---
> **Reminder:** Gemini AI will automatically post a code review on this PR. Please address any flagged security or bug issues before merging.
