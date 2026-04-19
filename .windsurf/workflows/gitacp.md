---
description: Git add, commit with proper message, and push to active branch with safety checks
---

# Git Add, Commit, Push Workflow

## Phase 1: Pre-flight Safety Checks
1. **Check git status and current branch**
   ```bash
   git status
   git branch --show-current
   ```

2. **Verify remote configuration**
   ```bash
   git remote -v
   ```

3. **Check for sensitive files** (secrets, keys, passwords)
   ```bash
   # Look for potential secrets in staged/modified files
   git diff --cached --name-only | xargs grep -l "password\|secret\|key\|token" 2>/dev/null || echo "No obvious secrets found"
   ```

4. **Check for large files** (>100MB)
   ```bash
   git diff --cached --name-only | xargs du -h 2>/dev/null | grep -E "^[0-9]+M.*[0-9]{3,}M" || echo "No large files detected"
   ```

## Phase 2: Staging Changes
1. **Review changes before staging**
   ```bash
   git diff --stat
   ```

2. **Stage changes selectively**
   ```bash
   # Add all changes (safe for most cases)
   git add .
   
   # OR add specific files (more controlled)
   # git add path/to/file1 path/to/file2
   ```

## Phase 3: Commit Message Generation
1. **Generate conventional commit message** based on changes:
   - `feat:` for new features
   - `fix:` for bug fixes  
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for test additions/changes
   - `chore:` for maintenance tasks

2. **Example commit messages:**
   ```
   feat: add unified graph proxy API endpoints
   fix: resolve MAES proxy authentication issue
   docs: update integration matrix for new capabilities
   refactor: optimize state reconciliation logic
   ```

## Phase 4: Commit and Push
1. **Commit with generated message**
   ```bash
   git commit -m "generated_commit_message"
   ```

2. **Push to remote**
   ```bash
   git push origin $(git branch --show-current)
   ```

## Phase 5: Verification
1. **Verify push succeeded**
   ```bash
   git status
   git log --oneline -3
   ```

## Error Handling
- **Merge conflicts**: Stop and ask user to resolve
- **Network issues**: Retry once, then ask user
- **Permission denied**: Check SSH keys or authentication
- **Large files**: Suggest using Git LFS or removing files

## Safety Rules
- NEVER commit files with obvious secrets
- ALWAYS review staged changes before committing
- USE conventional commit format
- VERIFY push succeeded before completing