# Design elements: where to get them and how to add one

The decorations in `public/img/art/` (sprig, botanical sides, wildflowers, olive branch, stars, sun) are original drawings made for this project, so they carry no license terms beyond this repository's own.

## Adding a decoration

1. Find or draw a one-color SVG. Colors in the file do not matter: the site uses it as a mask and paints it in the palette's second color, so it fits every palette.
2. Put it in `public/img/art/`.
3. Add one line to `ARTS` in `public/js/designs.js`, for example:

   ```js
   roses: { name: "Roses", ornament: "roses.svg", ratio: 2.6, sides: "roses-side.svg" },
   ```

   - `ornament`: the small piece above the names and on the home page. `ratio` is its width divided by its height.
   - `sides`: a tall piece (about 1:4) shown down both edges of wide screens, mirrored on the right.
   - `scatter`: a piece tiled softly behind the landing and home hero.
   - `panel`: a large square piece for the split layout's side panel.
4. Run `npm test`. It fails if a file named in `ARTS` is missing.

Keep files small (under 20 KB) and avoid embedded bitmaps; a mask only uses the shape.

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
