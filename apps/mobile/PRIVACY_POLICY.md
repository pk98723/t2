# Privacy Policy — T2 (Think Twice)

**Last updated:** August 2026

## Overview
T2 ("Think Twice") is a personal finance decision app that helps users analyze purchase decisions, track expenses, and manage savings goals. This policy explains how we collect, use, and protect your data.

## 1. Data We Collect
- **Authentication data**: Email address and name (via Microsoft/Azure AD or Google OAuth).
- **Financial data**: Monthly salary, expenses, transactions, savings goals, purchase decisions, and category budgets that you voluntarily enter.
- **Usage data**: Basic app interaction data for crash reporting and analytics.

## 2. How We Use Data
- To calculate financial health scores, savings rates, and provide spending advice.
- To display your transaction history, bills, and savings goal progress.
- To improve the app's features and fix bugs.

## 3. Data Storage & Security
- All data is stored in **Supabase** (a HIPAA-compliant cloud database with encryption at rest and in transit).
- Authentication is handled by **Microsoft Azure AD** / **Google OAuth** — we never see or store your password.
- We use industry-standard security practices including Row-Level Security (RLS) in the database, ensuring each user can only see their own data.

## 4. Data Sharing
- **We do not sell, rent, or share your personal or financial data with third parties.**
- Financial data is never used for advertising or marketing.
- We may share anonymized, aggregate data for analytics purposes.

## 5. Data Retention
- We retain your data as long as your account is active.
- You can delete your account and all associated data at any time by contacting us.

## 6. Your Rights
- **Access**: You can view all your data within the app.
- **Export**: You can export your transactions as CSV from the Insights / Expenses screens.
- **Deletion**: You can delete individual transactions, goals, or categories within the app. To delete your entire account, contact us.

## 7. Children's Privacy
T2 is not intended for users under 13. We do not knowingly collect data from children.

## 8. Changes
We may update this policy. Significant changes will be notified via the app.

## 9. Contact
For questions, account deletion requests, or data concerns:  
**Email:** [your-email@example.com]  
**GitHub:** [github.com/pk98723/t2](https://github.com/pk98723/t2)

---

*Built with React Native (Expo) + Supabase. Hosted on Cloudflare Workers.*