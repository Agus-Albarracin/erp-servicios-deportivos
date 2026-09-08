# Format Conventional Commit Messages

Use this subject grammar:

```text
<type>[optional scope][!]: <imperative summary>
```

Keep the summary concise, specific, lowercase unless a proper noun requires capitals, and free of a trailing period. Describe the outcome rather than the editing activity.

Use a body only when the motivation, tradeoff, migration, or non-obvious consequence needs explanation. Use `BREAKING CHANGE:` in the footer, or `!` in the subject, only for an actual breaking change. Add issue references only when known and relevant.

Do not use vague subjects such as `update files`, `misc changes`, or `fix stuff`.
