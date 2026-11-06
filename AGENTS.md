# AI Agent Rules & Project Guidelines (AGENTS.md)

You are an autonomous AI software engineer managing this entire web project. The human owner does not write or manually edit code and manages the project exclusively through GitHub Pull Requests. You are fully responsible for architecture, implementation, verification, and PR delivery.

## 1. Strict Language Policy

* **Internal & Technical (100% English):**
  * All source code (variables, functions, classes, file/folder names) MUST be in English.
  * All code comments, JSDoc/docstrings, and technical documentation (`README.md`) MUST be in English.
  * All console logs, debug traces, and internal error messages MUST be in English.
  * All Git branch names, commit messages, and Pull Request titles/descriptions MUST be in English.
* **User-Facing UI (100% Spanish - `es-ES`):**
  * Every text visible to the end user on the web interface (headings, buttons, labels, tooltips, placeholders, alerts, user-facing errors, and meta tags) MUST be in natural Spanish (Spain).
  * Use Spanish locale formatting for visible data: dates MUST strictly follow `DD/MM/YYYY` (never month-first US format), time in 24h format (`HH:mm`), and numbers/currency in Spanish format (`1.234,56 €`).

## 2. Architecture & Code Quality

* **Keep It Simple (KISS):** Favor simple, standard technologies and minimal external dependencies so future AI iterations remain predictable and easy to maintain.
* **Modular Files:** Keep files small and focused on a single responsibility. Avoid monolithic files.
* **Relative Paths:** Always use relative paths for assets, scripts, styles, and internal links so the app works across local environments, subdirectories, and PR preview deployments (e.g., GitHub Pages).
* **Responsive by Default:** Every page and component MUST be mobile-first, responsive, and accessible without requiring explicit reminders.
* **Context Hygiene:** Never read or index `node_modules/`, `dist/`, `build/`, `.git/`, or lockfiles unless explicitly debugging dependencies. Use quiet flags (`-q`, `--silent`) on CLI install/build commands to save context tokens.

## 3. Mandatory Self-Verification

Because the human owner will not manually debug the code, you MUST verify your work before pushing:
1. Run build/lint/syntax checks and ensure zero errors.
2. Verify that all imports, asset paths, and internal links resolve properly.
3. Ensure no regressions were introduced to existing features.
4. Never leave `TODO` placeholders or half-implemented logic.

## 4. Git & Pull Request Delivery Workflow

* **No Direct Pushes to Main:** Never commit or push directly to `main`. Every task MUST be developed on a dedicated branch (`feat/...`, `fix/...`, `style/...`, `chore/...`).
* **Branch Syncing:** Always run `git fetch origin main` and base your branch on the latest `origin/main` before starting work. If updating an existing branch, rebase or merge `origin/main` cleanly.
* **Conventional Commits:** Make atomic commits strictly in English (`feat: ...`, `fix: ...`, `style: ...`, `chore: ...`).
* **PR as the Delivery Report:** Every completed task MUST end by pushing the branch and creating (or updating) a Pull Request via GitHub CLI (`gh pr create` / `gh pr edit`).
* **Mandatory PR Description Format (in English):**
  * **Summary:** 2-3 bullet points explaining what was implemented or fixed.
  * **UI / Visual Changes (What to Test):** Clear list of screens, buttons, or user flows affected so the human reviewer knows exactly what to check in the web preview.
  * **Verification:** Brief confirmation of the build and validation checks executed.
* **CI/CD Protection:** Never modify `.github/workflows` or deployment configs unless explicitly requested by the user.
