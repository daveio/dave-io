# Pending Tasks

- **TODO:** _29fa91_ Migrate `/ai/alt` to Claude via API Gateway, following the patterns in `/ai/social`.
  - Use Claude 4 Sonnet, as used in `/ai/social`.
  - Claude 4 likes to return Markdown, even for single JSON objects. Make sure we ask for JSON, then strip the JSON out the same way we do for `/ai/social`.
  - Use the image optimisation code to bring the input image under 5 MB.
  - Make sure the `cf-aig-authorization` is set, as per `/ai/social`.
  - Extract shared code between `/ai/social` and the new Claude-based `/ai/alt` to a helper and reference it from both.
