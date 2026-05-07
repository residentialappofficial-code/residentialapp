# Superpowers Framework

This project uses the Superpowers agentic skills framework.

## Using Skills
Before any response or action, check for relevant skills in `.agents/skills/`. If a skill applies, you MUST use it.

**REQUIRED SUB-SKILL:** Use superpowers:using-superpowers

## Tool Mapping
Skills use Claude Code tool names. Use these Antigravity equivalents:

| Skill Reference | Antigravity Tool |
|-----------------|------------------|
| `Read`          | `view_file`      |
| `Write`         | `write_to_file`   |
| `Edit`          | `replace_file_content` / `multi_replace_file_content` |
| `Bash`          | `run_command`    |
| `Grep`          | `grep_search`    |
| `Glob`          | `run_command` (ls -R) |
| `Skill`         | `view_file` (on SKILL.md) |
| `Task`          | `browser_subagent` (or just execute yourself if subagents not available) |

## Worktrees
Worktrees are stored in `.worktrees/`.
