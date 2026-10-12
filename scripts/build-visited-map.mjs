/**
 * Generates public/visited-countries-map.svg: a world map with the countries
 * Dev has visited filled in the site's frame blue.
 *
 * Run: npm i --no-save world-atlas topojson-client topojson-simplify d3-geo d3-geo-projection
 *      node scripts/build-visited-map.mjs
 *
 * To add a country, add its name to VISITED (names are Natural Earth's, as
 * shipped in world-atlas, e.g. "United States of America", "Dominican Rep.").
 * The script fails loudly if a name is not found.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoPath } from "d3-geo";
import { geoMiller } from "d3-geo-projection";
import { feature } from "topojson-client";
import { presimplify, simplify, sphericalTriangleArea } from "topojson-simplify";

const require = createRequire(import.meta.url);
const detailed = JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8"));

/**
 * 50m detail is overkill for a ~1000px map; simplify to roughly a pixel of
 * tolerance (a 1000px-wide world is ~0.36 degrees per px) so the file stays small.
 */
const MIN_WEIGHT = 1e-5;
const topology = simplify(presimplify(detailed, sphericalTriangleArea), MIN_WEIGHT);

/** Same blue as the border around every page (.frame in test.module.css). */
const VISITED_FILL = "#2864f0";
const LAND_FILL = "#e4e7eb";
const BORDER = "#ffffff";
const WIDTH = 1000;
const PAD = 6;

const VISITED = [
  "Albania", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Aruba", "Barbados", "Belarus", "Belgium", "Belize", "Bolivia",
  "Bosnia and Herz.", "Brazil", "Bulgaria", "Canada", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Czechia", "Denmark", "Dominican Rep.",
  "Ecuador", "El Salvador", "eSwatini", "Estonia", "Fiji", "Finland", "France",
  "Georgia", "Germany", "Greece", "Guatemala", "Guyana", "Honduras", "Hungary",
  "Iceland", "India", "Ireland", "Italy", "Japan", "Kenya", "Kosovo", "Latvia",
  "Lesotho", "Lithuania", "Macedonia", "Madagascar", "Malta", "Mauritius",
  "Mexico", "Moldova", "Mongolia", "Montenegro", "Netherlands", "New Zealand",
  "Nicaragua", "Norway", "Panama", "Paraguay", "Peru", "Poland", "Portugal",
  "Puerto Rico", "Romania", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "Spain", "Suriname", "Sweden", "Switzerland",
  "Taiwan", "Trinidad and Tobago", "Ukraine", "United Kingdom",
  "United States of America", "Uruguay",
];

/** Territories that share their parent's fill but are not counted separately. */
const PART_OF = {
  China: ["Hong Kong", "Macao"],
  Finland: ["Åland"],
  "United Kingdom": ["Jersey", "Guernsey", "Isle of Man"],
};

/** Below this projected area (px²) a country gets an outline so it stays visible. */
const TINY_AREA = 20;

const countries = feature(topology, topology.objects.countries).features.filter(
  (country) => country.properties.name !== "Antarctica",
);
const byName = new Map(countries.map((country) => [country.properties.name, country]));

const missing = [...VISITED, ...Object.values(PART_OF).flat()].filter((name) => !byName.has(name));
if (missing.length) throw new Error(`Unknown country name(s): ${missing.join(", ")}`);
if (new Set(VISITED).size !== VISITED.length) throw new Error("Duplicate entries in VISITED");

const filled = new Set([...VISITED, ...Object.values(PART_OF).flat()]);

const projection = geoMiller().scale(WIDTH / (2 * Math.PI)).translate([0, 0]);
const path = geoPath(projection).digits(1);

const [[x0, y0], [x1, y1]] = path.bounds({ type: "FeatureCollection", features: countries });
const originX = Math.floor(x0) - PAD;
const originY = Math.floor(y0) - PAD;
const width = Math.ceil(x1) + PAD - originX;
const height = Math.ceil(y1) + PAD - originY;

const draw = (country) => {
  const d = path(country);
  if (!d) return "";
  const tiny = filled.has(country.properties.name) && path.area(country) < TINY_AREA;
  const outline = tiny ? ` stroke="${VISITED_FILL}" stroke-width="2"` : "";
  return `<path d="${d}"${outline}/>`;
};

const land = countries.filter((c) => !filled.has(c.properties.name)).map(draw).join("");
const visited = countries.filter((c) => filled.has(c.properties.name)).map(draw).join("");

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${originX} ${originY} ${width} ${height}" role="img" aria-label="World map with the countries Dev Sanghavi has visited filled in blue">` +
  `<g fill="${LAND_FILL}" stroke="${BORDER}" stroke-width="0.6" stroke-linejoin="round">${land}</g>` +
  `<g fill="${VISITED_FILL}" stroke="${BORDER}" stroke-width="0.6" stroke-linejoin="round">${visited}</g>` +
  `</svg>\n`;

writeFileSync(new URL("../public/visited-countries-map.svg", import.meta.url), svg);
console.log(`Wrote public/visited-countries-map.svg: ${VISITED.length} countries, ${width}x${height}, ${(svg.length / 1024).toFixed(0)} KB`);
