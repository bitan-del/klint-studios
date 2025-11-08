# Setting Up GitHub Actions Security Workflow

## 📋 Manual Setup (Required)

Since GitHub requires workflow scope for Personal Access Tokens, you need to manually create the security workflow.

## 🔧 Steps to Create Workflow

### Option 1: Via GitHub UI (Recommended)

1. **Go to your repository on GitHub**
2. **Click on "Actions" tab**
3. **Click "New workflow"**
4. **Click "set up a workflow yourself"**
5. **Name the file**: `security-check.yml`
6. **Copy the content** from `.github/workflows/security-check.yml`
7. **Click "Start commit"**
8. **Commit the file**

### Option 2: Via GitHub CLI

```bash
# Install GitHub CLI if not installed
brew install gh  # or download from https://cli.github.com/

# Authenticate
gh auth login

# Create the workflow file
gh workflow create .github/workflows/security-check.yml
```

### Option 3: Enable Workflow Scope in PAT

1. **Go to GitHub Settings** → **Developer settings** → **Personal access tokens**
2. **Create a new token** (or edit existing)
3. **Enable "workflow" scope**
4. **Use this token** for git operations

## ✅ Verification

After creating the workflow:

1. **Make a test commit** with a potential secret
2. **Check Actions tab** - the workflow should run
3. **Verify it catches** the security issue

## 🔍 What the Workflow Does

- Checks for exposed Gemini API keys
- Checks for exposed Cloudinary credentials
- Checks for committed `.env` files
- Fails the build if secrets are found

## 🚨 Important Notes

1. **Workflow runs on every push** to main/develop
2. **Workflow runs on pull requests** to main/develop
3. **Build will fail** if secrets are detected
4. **Review the workflow** before committing

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

