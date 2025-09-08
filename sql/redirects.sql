CREATE TABLE 'redirects' (
  'slug' text PRIMARY KEY NOT NULL,
  'destination' text NOT NULL
);
INSERT INTO redirects (slug, destination)
VALUES ('blog', 'https://blog.dave.io'),
  ('bluesky', 'https://bsky.app/profile/dave.io'),
  ('blit', 'https://notes.dave.io/blit'),
  ('bsky', 'https://dave.io/go/bluesky'),
  ('github', 'https://github.com/daveio'),
  ('fetlife', 'https://fetlife.com/users/22725'),
  ('facebook', 'https://facebook.com/dave.io'),
  ('cv', 'https://notes.dave.io/cv'),
  ('dreamwidth', 'https://daveio.dreamwidth.org'),
  (
    'gnupg',
    'https://keyoxide.org/729A7FAAB95A78A7AAB70E06B22EFAE146E2BB7E'
  ),
  ('journal', 'https://daveio.dreamwidth.org'),
  (
    'gpg',
    'https://keyoxide.org/729A7FAAB95A78A7AAB70E06B22EFAE146E2BB7E'
  ),
  (
    'hunter2',
    'https://bash-org-archive.com/?244321'
  ),
  (
    'key',
    'https://keyoxide.org/729A7FAAB95A78A7AAB70E06B22EFAE146E2BB7E'
  ),
  ('instagram', 'https://instagram.com/daveio'),
  ('pillowfort', 'https://pillowfort.social/daveio'),
  ('linkedin', 'https://linkedin.com/in/dcwilliams'),
  ('mastodon', 'https://basilisk.gallery/@dave'),
  (
    'nerd-fonts',
    'https://files.dave.io/nerd-fonts.zip'
  ),
  (
    'pgp',
    'https://keyoxide.org/729A7FAAB95A78A7AAB70E06B22EFAE146E2BB7E'
  ),
  (
    'sexmap',
    'https://humansexmap.com/showmap.php?mapid=map521a7bd04ec217.96418626'
  ),
  (
    'public-key',
    'https://keyoxide.org/729A7FAAB95A78A7AAB70E06B22EFAE146E2BB7E'
  ),
  (
    'these-days',
    'https://customer-scrk7cl14o51h5z9.cloudflarestream.com/80928e82f8196982e8fa4e83a509e622/watch'
  ),
  ('soundcloud', 'https://soundcloud.com/davedotio'),
  ('radio', 'https://qrz.com/db/M6LNS'),
  ('threads', 'https://threads.com/@daveio'),
  (
    'wat',
    'https://destroyallsoftware.com/talks/wat'
  ),
  ('tumblr', 'https://tumblr.com/blog/daveio'),
  (
    'todo',
    'https://daveio.notion.site/185b7795690c80399615eb0f5d5033c0'
  );
