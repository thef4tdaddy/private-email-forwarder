# GitHub Actions Setup for Email Processing

This replaces Uptime Robot with free GitHub Actions that run your email processing automatically.

## 🚀 Quick Setup

### 1. Repository Settings
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add this repository secret:
   - `VERCEL_APP_URL` = `https://your-app-name.vercel.app`

### 2. Workflow Details

**File:** `.github/workflows/email-check.yml`

**Schedule:** Runs every 3 hours (8 times per day):
- 12:00 AM, 3:00 AM, 6:00 AM, 9:00 AM
- 12:00 PM, 3:00 PM, 6:00 PM, 9:00 PM (UTC)

**What it does:**
- ✅ **Regular Email Check** - `/api/check-emails` (receipt detection)
- ✅ **Manual Forward Rules** - `/api/manual-forward` (catch-all rules)
- ✅ **Reply Processing** - `/api/process-replies` (learn from wife's commands)
- ✅ **Error handling** with detailed logging
- ✅ **Manual trigger** option in GitHub UI

## 🎛️ Manual Control

### Run Immediately
1. Go to **Actions** tab in your GitHub repo
2. Click **Email Processing** workflow
3. Click **Run workflow** dropdown
4. Choose mode:
   - `all` - Run everything (default)
   - `regular` - Only regular email checks
   - `manual` - Only manual forward rules
   - `replies` - Only reply processing
5. Click **Run workflow**

### View Results
- **Actions** tab shows all runs
- Click any run to see detailed logs
- Green checkmark = success
- Red X = failure with error details

## 📊 Monitoring

**GitHub provides:**
- ✅ **Free tier:** 2,000 minutes/month (plenty for this)
- ✅ **Reliable scheduling** (better than Uptime Robot free)
- ✅ **Detailed logs** of each run
- ✅ **Failure notifications** (optional)
- ✅ **Manual triggers** for testing

## ⚙️ Customization

### Change Frequency
Edit `.github/workflows/email-check.yml`:

```yaml
schedule:
  # Every 2 hours (12 times per day)
  - cron: '0 */2 * * *'
  
  # Every hour (24 times per day)
  - cron: '0 * * * *'
  
  # Every 6 hours (4 times per day)
  - cron: '0 */6 * * *'
  
  # Twice per day (9 AM and 9 PM UTC)
  - cron: '0 9,21 * * *'
```

### Add Notifications
Add this step to get notified on failures:

```yaml
- name: Notify on Failure
  if: failure()
  run: |
    # Add your notification logic here
    # Email, Slack, Discord webhook, etc.
```

## 🔧 Troubleshooting

**Workflow not running?**
- Check if the file is in `.github/workflows/`
- Verify the YAML syntax is correct
- Ensure repository has Actions enabled

**API calls failing?**
- Verify `VERCEL_APP_URL` secret is set correctly
- Check Vercel deployment is working
- Look at detailed logs in Actions tab

**Want to test?**
- Use **Run workflow** button for immediate testing
- Check both regular and manual modes work

## 🎯 Why This is Better Than Uptime Robot Free

| Feature | GitHub Actions | Uptime Robot Free |
|---------|---------------|------------------|
| **HTTP Methods** | ✅ GET & POST | ❌ GET only |
| **Frequency** | ✅ Any schedule | ❌ 5 min max |
| **Logs** | ✅ Detailed | ❌ Basic |
| **Manual Triggers** | ✅ Yes | ❌ No |
| **Notifications** | ✅ Customizable | ❌ Limited |
| **Reliability** | ✅ Excellent | ❌ Sometimes flaky |

Your email processing is now fully automated with GitHub Actions! 🎉