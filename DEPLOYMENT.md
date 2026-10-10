# GitHub Pages deployment instructions

Status: WEB-P1 public candidate prepared locally; NOT_PUBLISHED. Dedicated repository name: static-a-dashboard. Exact GitHub owner and final inventory approval are still required before repository creation or first push.

1. Review the complete public payload `site/assets/dashboard-data.json`, `PUBLIC_CONTENT_AUDIT.md`, `site/public-manifest.json` and the local browser-test results supplied separately. Obtain explicit owner approval of these contents and the exact GitHub OWNER/static-a-dashboard and the final 12-file inventory (path, byte size, SHA256) supplied outside this public folder. Do not upload the preparation parent directory, private audit evidence, original research repository or original dashboard.
2. After approval, create a NEW dedicated PUBLIC repository named `static-a-dashboard` under the approved owner. Create an empty repository without an automatic README so the local history below can be pushed directly. Use Public visibility as authorized for this dedicated website repository. GitHub Free requires a public repository for Pages; other supported plans can use a private repository, but a private repository alone does not make its Pages site private. See [creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
3. Open a terminal in this `github-pages-ready` directory only. Replace OWNER with the approved GitHub account or organization before running the following commands. These commands are instructions, not an executed deployment:

Before `git init`, verify the complete approved inventory from the separate review bundle. Run this only inside the new `github-pages-ready` directory, and select the exact `PUBLIC_FILE_INVENTORY.json` whose digest you approved. Any mismatch requires a new review; do not push a changed bundle.

```powershell
if (Test-Path -LiteralPath '.git') { throw 'Use the new sanitized candidate before initialization' }
$approvedInventory = Get-Content -LiteralPath (Read-Host 'Path to approved PUBLIC_FILE_INVENTORY.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$candidateRoot = (Get-Location).Path.TrimEnd([char]92)
$actualPaths = @(Get-ChildItem -LiteralPath '.' -Recurse -Force -File | ForEach-Object { $_.FullName.Substring($candidateRoot.Length + 1).Replace([char]92,[char]47) } | Sort-Object)
$approvedPaths = @($approvedInventory.files.path | Sort-Object)
if (Compare-Object -ReferenceObject $approvedPaths -DifferenceObject $actualPaths) { throw 'Public file allowlist mismatch' }
foreach ($reviewedFile in $approvedInventory.files) {
  $candidateFile = Join-Path $candidateRoot $reviewedFile.path
  if ((Get-Item -LiteralPath $candidateFile).Length -ne $reviewedFile.bytes) { throw 'Public file size mismatch' }
  if ((Get-FileHash -LiteralPath $candidateFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $reviewedFile.sha256) { throw 'Public file checksum mismatch' }
}
'PUBLIC_FILES_MATCH_APPROVED_INVENTORY'
```

```powershell
git init -b main
git add -- .gitignore README.md DEPLOYMENT.md PUBLIC_CONTENT_AUDIT.md .github/workflows/deploy-pages.yml site/.nojekyll site/SHA256SUMS site/assets/dashboard-data.json site/assets/dashboard.css site/assets/dashboard.js site/index.html site/public-manifest.json
git status --short
git diff --cached --stat
git commit -m "Add reviewed STATIC_A saved dashboard"
git remote add origin https://github.com/OWNER/static-a-dashboard.git
git push -u origin main
```

Expected tracked files: four top-level text files (`.gitignore`, README, DEPLOYMENT, PUBLIC_CONTENT_AUDIT), one workflow, and exactly seven files under `site/`. Stop if extra files appear. Do not run `git add` from the original project or the preparation parent folder.

4. In the approved GitHub repository, select Settings → Pages → Build and deployment → Source → GitHub Actions. Follow [configuring the publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Under Settings → Environments, configure `github-pages` for the approved branch and any review rules supported by the account.
5. Open Actions → Deploy reviewed STATIC_A static site → Run workflow → branch `main`. This is a manual-only deployment: no `push`, schedule or automatic trigger is configured. The workflow verifies the seven-file site allowlist and checksums, uploads only `site/`, and uses the built-in GitHub token/OIDC permissions; do not paste personal tokens into site files or workflow YAML. The static artifact requires no build or Python/SQLite runtime. See [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
6. Wait for both jobs to succeed and use the deployment environment URL (normally `https://OWNER.github.io/static-a-dashboard/` for a project site). Confirm the latest saved Top3 is 2026-10-08, public manifest count is 5538, full-history count is 5538, Phase5R count is 21, certified Live count is zero, Chinese/name/code search works, and Pending/Unknown details remain intact. Check Network for only same-site static requests and no failed assets. Save the actual commit SHA, workflow run URL and published page URL as deployment evidence. Actual GitHub execution remains unverified until this authorized step occurs.
7. Future data updates require a new reviewed static snapshot, a new safety audit, regenerated `site/SHA256SUMS`, and an explicitly dispatched deployment. This package adds no daily intake or production scheduling.

## Rollback

After a deployed change, restore the approved previous static commit (for example with a reviewed `git revert`), push it, then dispatch the same manual workflow. Verify the previous manifest and record count. This repository has no connection to the original local dashboard, database or production scheduler; rollback does not edit those systems.

## Local preview

Serve only `site/` using any local static file server and open its HTTP URL. Double-clicking the HTML from the filesystem can block JSON fetching in browsers; it is not how Pages serves the site. A local preview tool is optional and is not shipped or required on Pages.
