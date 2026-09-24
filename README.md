# peninsulaforeveryone.github.io

Peninsula For Everyone, the YIMBY Action chapter for San Mateo County. This is the index page for the chapter's open-source data tools, published by GitHub Pages at https://peninsulaforeveryone.github.io/.

## Adding a project

1. Add an entry to `_data/projects.yml` (newest first): `title`, `url`, `repo`, `image`, and a one-sentence `description`.
2. Add its teaser image, 1200×750, at `assets/img/projects/<repo-name>.jpg`. Either add a matching entry to `PROJECTS` in `scripts/screenshots.mjs` and run it (below), or drop in your own image.

## Refreshing the screenshots

The teaser images are captured from the live sites with headless Chrome:

```sh
cd scripts
npm install
npm run screenshots                            # all projects
npm run screenshots -- permit-timeline-tracker # one project
```

It writes straight into `assets/img/projects/`, so check the results before committing. Set `OUT_DIR=/some/dir` to write somewhere else, or `CHROME_PATH` if Chrome isn't in the default location. If a tool's layout changes, adjust that project's `selector` and `clip` in the script.

## Previewing locally

```sh
jekyll serve --livereload   # then open http://localhost:4000
```

While serving, the `og:url`, `og:image`, and canonical tags show `http://localhost:4000`. Jekyll swaps in `site.url` only for local serving; GitHub Pages builds them with `https://peninsulaforeveryone.github.io`.

## Layout

```
index.md                 kicker, headline, hero photo, and intro sentence
_data/projects.yml       the project cards
_layouts/default.html    page structure, shared P4E header/footer, social tags
assets/css/p4e.css       styles, using the palette shared with the project sites
assets/img/              hero photo, share image (og-image.jpg), icons, project screenshots
scripts/                 screenshot tooling (not published)
```
