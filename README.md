# Alex Argilés — Portfolio

Personal portfolio site for Alex Argilés Acevedo — Emmy Award-winning Producer, Writer, and Director based in New York City.

**Live site:** https://www.alexargiles.com

## Stack

Pure HTML · CSS · JavaScript — no frameworks, no build tools.

## Structure

```
index.html          # Homepage — hero, project panels, about, contact
emmys.html          # Emmy Awards page
work/               # Individual video player pages per film
css/
  style.css         # Design system + full site styles
  emmys.css         # Emmy page styles
  player.css        # Video player styles
js/
  main.js           # Cursor, nav, panels, scroll reveal
  player.js         # Video player controls
images/             # Posters, laurels, favicon, OG image
video/              # MP4 files (excluded from git — hosted via CDN)
```

## Notes

Video files are excluded from this repo (too large for git).
They are hosted via CDN and referenced by URL in the HTML source.
