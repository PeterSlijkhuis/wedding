# Design elements: where to get them and how to add one

The decorations in `public/img/art/` are original drawings made for this project by `scripts/make_art.py`, so they carry no license terms beyond this repository's own. Each decoration is two files: `<name>.svg`, the ornament above the names (300 x 100), and `<name>-corner.svg`, the arrangement for the top-left corner of the page (400 x 400). The site turns the same corner round for the bottom right.

## Colors: three tones from the palette

Shapes in the files carry a class instead of a color, and `site.css` paints them from the palette, so every decoration fits every palette and the couple's own colors:

| Class | Tone |
|---|---|
| `l` (fill), `s` or `ls` (stroke) | leaf: the palette's second color |
| `d` (fill), `ds` (stroke) | deep: the accent color, softened |
| `t` (fill), `ts` (stroke) | light: a pale tint of the second color |

`npm test` fails if a decoration file contains a fixed color.

## Adding a decoration

1. Draw it in `scripts/make_art.py`: add a `corner_<name>()` function and a case in `ornament_for()`, using the leaf, flower and branch helpers there, then run `python3 scripts/make_art.py`. A hand-drawn SVG works too, as long as every shape uses one of the classes above and the root `<svg>` has `class="art"`.
2. Add one line to `ARTS` in `public/js/designs.js`, for example `roses: { name: "Roses", svg: "roses" },`.
3. Run `npm test`. It fails if a file is missing.

Keep each file under about 100 KB; they are loaded once per visit.

## Free sources whose license allows shipping the files in an open-source project

| Source | License | Notes |
|---|---|---|
| [Openclipart](https://openclipart.org) | CC0 (public domain) | SVG; flowers, laurels, frames, stars. |
| [rawpixel public domain collection](https://www.rawpixel.com/category/53/public-domain) | CC0 | Vintage botanical prints; trace to SVG before use. |
| [Biodiversity Heritage Library on Flickr](https://www.flickr.com/photos/biodivlibrary/) | Public domain (no known copyright) | Historic botanical drawings; check each item's statement. |
| [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Botanical_illustrations) | Varies per file | Use only files marked public domain or CC0, to avoid attribution duties. |
| [Tabler Icons](https://tabler.io/icons), [Phosphor Icons](https://phosphoricons.com) | MIT | Small line icons (leaf, flower, sparkle, heart, rings). Keep the MIT notice in `docs/`. |
| [SVG Repo](https://www.svgrepo.com) | Varies per item | Many items are CC0 or MIT; check each one's license line. |

Avoid for this project: Freepik, Vecteezy, Canva, Creative Market and Envato. Their free tiers require attribution or forbid redistributing the files, which an open-source repo does by definition. [Likely: check their current terms if you plan to use them.]
