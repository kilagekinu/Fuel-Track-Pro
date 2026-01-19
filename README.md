
# FuelTrack Pro - Production Setup

## 🚀 Deployment Instructions
1. **Environment**: This is a static-capable React application. Deploy to Vercel, Netlify, or AWS Amplify.
2. **API Configuration**: Ensure the `API_KEY` for Gemini Insights is set in your environment variables if using the AI analysis features.
3. **PWA Support**: The current architecture is designed for "Add to Home Screen" to support offline field data entry.

## 📊 Database Schema (Conceptual)
If migrating to a persistent DB (PostgreSQL/MongoDB):
- **Users**: `{id, name, role, secret_hash}`
- **Tanks**: `{id, fuel_type, capacity, current_volume}`
- **Meters**: `{id, type, last_reading}`
- **Reconciliations**: `{id, date, fuel_type, opening, receipts, sales, dips, variance, status, versions: []}`
- **AuditLogs**: `{id, action, user_id, payload, timestamp}`

## 🛠️ Business Logic: Mass Balance Equation
`Variance = (Opening Stock + Receipts - Transfers Out) - Closing Physical Stock - Metered Sales`
Acceptable tolerance: < 0.5% of total throughput. Values exceeding 1.0% trigger red alerts.
