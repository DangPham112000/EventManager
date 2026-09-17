# GitHub Personal Access Token (PAT) Setup Guide

This guide walks you through creating a **Personal Access Token (Classic)** with full permissions and adding it as a repository secret for the CI/CD pipeline.

---

## Why a PAT Instead of `GITHUB_TOKEN`?

The default `GITHUB_TOKEN` is scoped to the **current repository only** and has limited permissions. A Personal Access Token (PAT) is required when you need:

- **Push/pull Docker images** to GitHub Container Registry (`ghcr.io`)
- **Access packages** across repositories
- **Broader API access** for deployment workflows

> [!IMPORTANT]
> The deploy workflow ([`deploy.yml`](file:///c:/Workspace/EventManager/.github/workflows/deploy.yml)) uses `secrets.GH_PAT` in three places:
> - Backend build → GHCR login (line 36)
> - Frontend build → GHCR login (line 78)
> - VPS deploy → Docker login on the server (line 139)

---

## Step 1: Create a Personal Access Token (Classic)

1. Go to **GitHub** → Click your **profile avatar** (top-right) → **Settings**
2. In the left sidebar, scroll down and click **Developer settings**
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token** → **Generate new token (classic)**
5. Fill in the token details:

| Field | Value |
|---|---|
| **Note** | `EventManager CI/CD` (or any descriptive name) |
| **Expiration** | Choose an appropriate expiration (e.g., 90 days, or "No expiration" for permanent) |

6. **Select ALL scopes** (Full Permissions) by checking the top-level checkboxes:

   - [x] **`repo`** — Full control of private repositories
   - [x] **`workflow`** — Update GitHub Action workflows
   - [x] **`write:packages`** — Upload packages to GitHub Package Registry
   - [x] **`read:packages`** — Download packages from GitHub Package Registry
   - [x] **`delete:packages`** — Delete packages from GitHub Package Registry
   - [x] **`admin:org`** — Full control of orgs and teams
   - [x] **`admin:public_key`** — Full control of user public keys
   - [x] **`admin:repo_hook`** — Full control of repository hooks
   - [x] **`admin:org_hook`** — Full control of organization hooks
   - [x] **`gist`** — Create gists
   - [x] **`notifications`** — Access notifications
   - [x] **`user`** — Update ALL user data
   - [x] **`delete_repo`** — Delete repositories
   - [x] **`write:discussion`** — Read and write team discussions
   - [x] **`admin:enterprise`** — Full control of enterprises
   - [x] **`admin:gpg_key`** — Full control of user GPG keys
   - [x] **`codespace`** — Full control of codespaces
   - [x] **`copilot`** — Full control of GitHub Copilot settings
   - [x] **`project`** — Full control of projects
   - [x] **`admin:ssh_signing_key`** — Full control of SSH signing keys
   - [x] **`audit_log`** — Full control of audit log

7. Click **Generate token**

> [!CAUTION]
> **Copy the token immediately!** GitHub will only show it once. If you lose it, you'll need to generate a new one.

Example token format:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 2: Add the PAT as a Repository Secret

1. Go to your repository: **[EventManager](https://github.com/DangPham112000/EventManager)**
2. Click **Settings** tab (you need admin access)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:

| Field | Value |
|---|---|
| **Name** | `GH_PAT` |
| **Secret** | Paste your Personal Access Token from Step 1 |

6. Click **Add secret**

> [!NOTE]
> The secret name **must** be exactly `GH_PAT` to match the workflow references: `${{ secrets.GH_PAT }}`

---

## Step 3: Verify the Setup

After adding the secret, trigger the deploy workflow to verify everything works:

### Option A: Push to `main`
```bash
git add .
git commit -m "ci: use PAT for GHCR authentication"
git push origin main
```

### Option B: Manual trigger
1. Go to the **Actions** tab in your repository
2. Select **Deploy to VPS** workflow
3. Click **Run workflow** → **Run workflow**

### Check the results
1. Go to **Actions** tab
2. Click on the latest workflow run
3. Verify all three jobs pass:
   - ✅ **Build & Push Backend** — GHCR login succeeds
   - ✅ **Build & Push Frontend** — GHCR login succeeds
   - ✅ **Deploy to VPS** — Docker login on server succeeds

---

## Troubleshooting

### ❌ `Error: unauthorized` during GHCR login
- Verify the PAT has **`write:packages`** and **`read:packages`** scopes
- Check the secret name is exactly `GH_PAT` (case-sensitive)
- Ensure the token hasn't expired

### ❌ `Error: denied` when pushing images
- Make sure the PAT owner has **write access** to the repository
- For organization repos, the PAT owner must be an org member with appropriate permissions

### ❌ Token expired
- Generate a new PAT following Step 1
- Update the repository secret following Step 2 (click the **Update** button on the existing `GH_PAT` secret)

---

## Security Best Practices

> [!WARNING]
> - **Never** commit your PAT to the repository or share it in plain text
> - **Set an expiration date** and rotate tokens periodically
> - **Use the minimum required scopes** if you don't need full permissions — for this workflow, `repo`, `write:packages`, `read:packages`, and `workflow` are the essential scopes
> - **Revoke** compromised tokens immediately at [GitHub Token Settings](https://github.com/settings/tokens)
