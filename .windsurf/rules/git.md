---
trigger: model_decision
description: This rule outlines best practices for effective use of Git, including code organization, commit strategies, branching models, and collaborative workflows.
globs: **/.git/*
---

- **Commit Strategies:**

  - **Atomic Commits:** Keep commits small and focused. Each commit should address a single, logical change. This makes it easier to understand the history and revert changes if needed.
  - **Descriptive Commit Messages:** Write clear, concise, and informative commit messages. Explain the _why_ behind the change, not just _what_ was changed. Use a consistent format (e.g., imperative mood: "Fix bug", "Add feature").
  - **Commit Frequently:** Commit early and often. This helps avoid losing work and makes it easier to track progress.
  - **Avoid Committing Broken Code:** Ensure your code compiles and passes basic tests before committing.
  - **Sign Your Commits (Optional but Recommended):** Use GPG signing to verify the authenticity of your commits.

- **Branching Model:**

  - **Use Feature Branches:** Create branches for each new feature or bug fix. This isolates changes and allows for easier code review.
  - **Gitflow or Similar:** Consider adopting a branching model like Gitflow for managing releases, hotfixes, and feature development.
  - **Short-Lived Branches:** Keep branches short-lived. The longer a branch exists, the harder it becomes to merge.
  - **Regularly Rebase or Merge:** Keep your feature branches up-to-date with the main branch (e.g., `main`, `develop`) by rebasing or merging regularly.
  - **Avoid Direct Commits to Main Branch:** Protect your main branch from direct commits. Use pull requests for all changes.

- **Code Organization:**

  - **Consistent Formatting:** Use a consistent coding style guide (e.g., PEP 8 for Python, Google Style Guide for other languages) and enforce it with linters and formatters (e.g., `flake8`, `pylint`, `prettier`).
  - **Modular Code:** Break down your codebase into smaller, manageable modules or components. This improves readability, maintainability, and testability.
  - **Well-Defined Interfaces:** Define clear interfaces between modules and components to promote loose coupling.
  - **Avoid Global State:** Minimize the use of global variables and state to reduce complexity and potential conflicts.
  - **Documentation:** Document your code with comments and docstrings. Explain the purpose of functions, classes, and modules.

- **Collaboration and Code Review:**

  - **Pull Requests:** Use pull requests for all code changes. This provides an opportunity for code review and discussion.
  - **Code Review Checklist:** Create a code review checklist to ensure consistency and thoroughness.
  - **Constructive Feedback:** Provide constructive feedback during code reviews. Focus on improving the code, not criticizing the author.
  - **Address Feedback:** Respond to and address feedback from code reviews promptly.
  - **Pair Programming:** Consider pair programming for complex or critical tasks.

- **Ignoring Files and Directories:**

  - **.gitignore:** Use a `.gitignore` file to exclude files and directories that should not be tracked by Git (e.g., build artifacts, temporary files, secrets).
  - **Global .gitignore:** Configure a global `.gitignore` file to exclude files that you never want to track in any Git repository.

- **Handling Secrets and Sensitive Information:**

  - **Never Commit Secrets:** Never commit secrets, passwords, API keys, or other sensitive information to your Git repository.
  - **Environment Variables:** Store secrets in environment variables and access them at runtime.
  - **Secret Management Tools:** Use secret management tools like HashiCorp Vault or AWS Secrets Manager to store and manage secrets securely.
  - **git-secret or similar:** If secrets must exist in the repo (strongly discouraged), encrypt them.

- **Submodules and Subtrees:**

  - **Use Sparingly:** Use Git submodules and subtrees sparingly, as they can add complexity.
  - **Understand the Implications:** Understand the implications of using submodules and subtrees before adopting them.
  - **Consider Alternatives:** Consider alternatives to submodules and subtrees, such as package managers or build systems.

- **Large File Storage (LFS):**

  - **Use for Large Files:** Use Git LFS for storing large files (e.g., images, videos, audio files). This prevents your repository from becoming bloated.
  - **Configure LFS:** Configure Git LFS properly to track the large files in your repository.

- **Reverting and Resetting:**

  - **Understand the Differences:** Understand the differences between `git revert`, `git reset`, and `git checkout` before using them.
  - **Use with Caution:** Use `git reset` and `git checkout` with caution, as they can potentially lose data.
  - **Revert Public Commits:** Use `git revert` to undo changes that have already been pushed to a public repository. This creates a new commit that reverses the changes.

- **Tagging Releases:**

  - **Create Tags:** Create tags to mark significant releases or milestones.
  - **Semantic Versioning:** Follow semantic versioning (SemVer) when tagging releases.
  - **Annotated Tags:** Use annotated tags to provide additional information about the release.

- **Dealing with Merge Conflicts:**

  - **Understand the Conflict:** Understand the source of the merge conflict before attempting to resolve it.
  - **Communicate with Others:** Communicate with other developers who may be affected by the conflict.
  - **Use a Merge Tool:** Use a merge tool to help resolve the conflict.
  - **Test After Resolving:** Test your code thoroughly after resolving the conflict.

- **Repository Maintenance:**

  - **Regularly Clean Up:** Regularly clean up your Git repository by removing unused branches and tags.
  - **Optimize the Repository:** Optimize the repository with `git gc` to improve performance.

- **CI/CD Integration:**

  - **Automate Testing:** Integrate Git with a CI/CD system to automate testing and deployment.
  - **Run Tests on Every Commit:** Run tests on every commit to ensure code quality.

- **Common Pitfalls and Gotchas:**

  - **Accidental Commits:** Accidentally committing sensitive information or large files.
  - **Merge Conflicts:** Difficulty resolving merge conflicts.
  - **Losing Work:** Losing work due to incorrect use of `git reset` or `git checkout`.
  - **Ignoring .gitignore:** Forgetting to add files to `.gitignore`.

- **Tooling and Environment:**
  - **Git Clients:** Use a Git client that suits your needs (e.g., command line, GUI).
  - **IDE Integration:** Use Git integration in your IDE to streamline workflows.
  - **Online Repositories:** Use a reliable online Git repository hosting service (e.g., GitHub, GitLab, Bitbucket).
