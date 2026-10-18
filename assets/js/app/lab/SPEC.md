# VINC Lab virtual labs — specification

Every Kaushal Bodh activity in the LMS has an in-app **lesson** and a **virtual lab**: a short,
playful simulator (2–6 minutes) that lets a Grade 6–8 child practise the idea behind the activity.
Labs are built from 15 reusable **lab types**; each activity's lab is a config object for one type.

```
assets/js/app/lab/runtime.js        the player (full-screen dialog, mission card, mascot, stars, sounds, win screen)
assets/js/app/lab/kit.js            shared helpers (h, art, token, shuffle, dragDrop, moveInto, evalExpr, shake, pop, sparkle, …)
assets/js/app/lab/sprites.js        sprite registry; sprite(name) -> <svg viewBox="0 0 100 100">
assets/js/app/lab/sprites-life.js   sprites: plants, food plants, nature, animals, garden materials
assets/js/app/lab/sprites-make.js   sprites: tools, instruments, machines, materials, water, electronics, computers
assets/js/app/lab/sprites-people.js sprites: people, places, museum, kitchen, health, media, money, puppets, symbols
assets/js/app/lab/types/<type>.js   one module per lab type
assets/css/lab.css                  player styles (loaded with the app)
assets/css/lab/<type>.css           one stylesheet per lab type, loaded when the type opens
assets/js/data/lessons/<pid>.js     lessons + lab configs for one project (e.g. g6p1.js)
lab-dev.html                        dev harness: open any type's demo, any lesson's lab, see all sprites
```

Libraries (vendored, loaded only when a lab opens): **GSAP 3.13** with Draggable, InertiaPlugin,
MotionPathPlugin, DrawSVGPlugin, MorphSVGPlugin, Physics2DPlugin, CustomEase (all registered), and
**Matter.js 0.20** for types that declare `meta.needs: ['matter']`.

---------------------------------------------------------------------------------------------------

## 1. Writing a lab type

```js
// assets/js/app/lab/types/sort.js
import { h, art, token, shuffle, dragDrop, shake, pop, sparkle, esc } from '../kit.js';
export const meta = { title: 'Sort it out', needs: ['gsap'] };      // or ['gsap', 'matter']
export function mount(stage, cfg, api) {
  // Build DOM/SVG inside `stage` (a flex column that fills the screen between the top bar and the mascot bar).
  // Use api.say / api.progress / api.mistake / api.complete. Return { destroy() } to clean up timers/listeners.
}
export const demo = { title: '…', mission: '…', /* a full, realistic config for this type */ };
```

Rules:
- **Root class**: wrap everything in one element with class `lab-<type>` and scope ALL your CSS under it
  in `assets/css/lab/<type>.css`. Never style bare tags or generic classes globally.
- Do **not** edit runtime.js, kit.js, sprites*.js, lab.css or another type's files. Keep extra helpers inside your file.
- Use **GSAP** for animation (timelines, eases like `back.out`, `elastic.out`, MotionPath, DrawSVG, MorphSVG),
  **Draggable** for drag (works with mouse and touch; use `type: 'x,y'`, `hitTest`), and **Matter.js** for physics.
  Prefer SVG for scenes (crisp at any size); canvas is fine for physics/particles.
- **Graphics quality**: rich, friendly flat illustration with depth — soft gradients, shadows (low-opacity ellipses),
  highlights, rounded shapes, consistent stroke widths. Use sprites from the registry (`api.sprite(name)`) and
  draw scene backgrounds yourself. Use the site palette from CSS custom properties so light AND dark mode work:
  `--paper --paper-2 --card --ink --ink-2 --muted --line --olive --olive-soft --rust --rust-soft --plum --plum-soft
  --amber --amber-soft --amber-ink --teal --teal-soft --ok --bad --warn`, and `--lf` / `--lf-soft` (the colour of
  the activity's form of work, set on the lab root).
- **Juice**: every action gets feedback — a sound (`api.sound('pop'|'good'|'bad'|'drop'|'click'|'tick'|'whoosh')`),
  a motion (snap, squash, bounce, sparkle) and a mascot line (`api.say`). Wrong answers explain *why*.
- **Layout**: must work from 360×640 (phone, portrait) to 1440×900. Touch targets ≥ 44px. No horizontal scroll.
  The stage scrolls vertically if needed but aim to fit without scrolling on desktop.
- **Accessibility**: buttons are real `<button>`s with text or aria-label; keyboard alternative for drag where
  practical (e.g. click/tap an item then click a target). Respect `api.reduced` (skip long animations;
  GSAP is already sped up 4× under reduced motion).
- **Completion**: call `api.complete()` exactly once when the goal is met (optionally `{ stars, message }`).
  Default stars come from `api.mistake()` calls: ≤1 → 3★, ≤3 → 2★, else 1★. Update `api.progress(0..1)` as the
  child advances.
- Text in configs is plain text; always escape it (`esc`) when building HTML.
- `demo` must be a complete, realistic config (Kaushal Bodh flavoured) that exercises the type's features.

### The `api` object
| member | what it does |
|---|---|
| `api.gsap`, `api.Draggable`, `api.MotionPathPlugin`, `api.Matter` | libraries (Matter only if `meta.needs` includes it) |
| `api.say(text, kind)` | mascot speech; kind `'info'` (default), `'good'`, `'bad'`, `'hint'` (good/bad also play a sound) |
| `api.progress(f)` | top progress bar, 0..1 |
| `api.mistake()` / `api.mistakes` | count a mistake / read the count |
| `api.complete({ stars?, score?, message? })` | finish: records the result and shows the win screen |
| `api.sound(kind)` | `click pop good bad whoosh drop win tick` |
| `api.sprite(name, {size, cls, title})`, `api.hasSprite(name)` | sprite markup |
| `api.art(item)` | art for a config item: `{sprite}` → sprite, `{emoji}` → emoji |
| `api.savePortfolio(dataUrl, title)` | save an image the child made to their portfolio (design type) |
| `api.onCleanup(fn)` | run when the lab restarts or closes |
| `api.colors()` | resolved palette colours as strings (for canvas drawing) |
| `api.reduced`, `api.root`, `api.cfg` | reduced-motion flag, the lab `<dialog>`, the config |

### Config fields common to every type
```js
{ type: 'sort', title: 'Short lab name', mission: 'One or two sentences: what to do and why.',
  fact: 'Optional "Did you know?" shown on the start card', win: 'Optional message on the win screen' }
```
**Items** (anything shown as a picture + label) are `{ label, sprite: 'name' }` or `{ label, emoji: '🥕' }`.
Use a sprite name from §3 whenever one fits; otherwise an emoji.

---------------------------------------------------------------------------------------------------

## 2. The 15 lab types and their configs

### 2.1 `sort` — drag items into the right bins
```js
{ type: 'sort', title, mission,
  bins: [ { id: 'wet', label: 'Wet waste', sprite?: 'compost-bin', color?: 'olive' }, … ],   // 2–4 bins; color is a palette name
  items: [ { label: 'Banana peel', sprite: 'banana', bin: 'wet', why: 'Peels rot quickly and feed the worms.' }, … ] } // 6–12 items
```
Items wait in a tray (shuffled). Drag (or tap item, then tap bin) into a bin. Right: snaps in, pops, says `why`.
Wrong: shakes back, mistake, says `why` as a hint. Done when every item is sorted.

### 2.2 `sequence` — put steps in order
```js
{ type: 'sequence', title, mission,
  steps: [ { label: 'Put a layer of dry leaves at the bottom', sprite?: 'dry-leaves', detail?: 'Keeps air flowing.' }, … ] } // correct order, 4–8
```
Shuffled cards; drag to reorder in numbered slots (or tap two cards to swap). "Check" locks correct positions
(green), mistakes counted per check. When all correct, play an animated walkthrough of the steps.

### 2.3 `match` — connect pairs
```js
{ type: 'match', title, mission, leftTitle: 'Tool', rightTitle: 'What it is for',
  pairs: [ { a: { label: 'Trowel', sprite: 'trowel' }, b: { label: 'Digging small holes for seedlings' }, why?: '…' }, … ] } // 4–7
```
Two columns (right shuffled). Drag from a left item to a right item: a curved rope draws between them; right
pairs lock in colour, wrong ones snap away. Tap-to-select fallback.

### 2.4 `layers` — build something layer by layer
```js
{ type: 'layers', title, mission,
  container: 'bin' | 'pot' | 'bottle' | 'trench' | 'tray' | 'bucket' | 'tank' | 'pit',
  layers: [ { label: 'Pebbles', texture: 'pebbles', why?: 'Lets extra water drain.' }, … ],   // bottom → top, 3–7
  distractors?: [ { label: 'Plastic bag', texture: 'plastic', why: 'Plastic never breaks down.' } ],
  after?: { anim: 'compost' | 'roots' | 'sprout' | 'filter' | 'bubbles' | 'none', text: 'What happens next…' } }
```
Textures: `soil pebbles sand gravel charcoal leaves dry-leaves green-waste kitchen-waste cow-dung compost worms water
cocopeat coir clay mulch seeds cloth net plastic cotton newspaper`. Layer cards in a side tray; drop into the
container; each layer fills with a textured, animated fill (GSAP). Wrong order / distractor bounces with `why`.
`after` plays a short time-lapse once complete (worms wriggling and waste darkening into compost, roots growing,
seeds sprouting, dirty water clearing as it filters down, bubbles rising).

### 2.5 `mix` — mix ingredients and read a meter
```js
{ type: 'mix', title, mission, vessel: 'glass' | 'bowl' | 'pot' | 'bucket' | 'tank' | 'jar',
  ingredients: [ { key: 'lemon', label: 'Lemon juice', sprite: 'lemon', color: '#F2D54A', unit: 'spoon', max: 5,
                   props: { sour: 3, sweet: 0, ph: 2.5 } }, … ],                   // 2–6
  meters: [ { key: 'sweet', label: 'Sweetness', min: 0, max: 10 }, … ],           // 1–3; value = sum of props*amount,
                                                                                   // except 'ph' = amount-weighted average
  target: { text: 'Make a lemonade that is sweet and a little sour',
            rules: [ { meter: 'sweet', min: 4, max: 7 }, { amount: 'lemon', min: 1, max: 2 }, { colorNear: '#F5E6A0', tolerance: 60 } ] },
  good?: 'Perfect balance!', tips?: { sweet: { low: 'Add a little sugar.', high: 'Too sweet! Add water.' } } }
```
Tap/drag an ingredient to pour/drop it in (pouring/dropping animation, liquid colour blends by amount, level
rises, bubbles/ripples). Meters animate. "Check" tests the rules, gives tips. Reset button empties the vessel.

### 2.6 `grow` — grow a plant (time-lapse simulator)
```js
{ type: 'grow', title, mission,
  plant: 'tomato' | 'spinach' | 'lettuce' | 'chilli' | 'bean' | 'marigold' | 'sapling' | 'microgreens' | 'coriander',
  medium: 'soil' | 'water' | 'cocopeat',
  days: 40,
  controls: [ { key: 'water', label: 'Water per day', min: 0, max: 10, ideal: [4, 6], unit: 'cups' }, … ],
             // keys: water, sun (hours), nutrients, ph, spacing (cm), temp (°C), shade (%)
  events?: [ { day: 12, kind: 'pests' | 'heat' | 'rain' | 'weeds' | 'wilting', text: 'Aphids on the leaves!',
               fix: 'neem' | 'shade' | 'weed' | 'drain' | 'water', fixLabel: 'Spray neem' } ],
  harvest?: { text: 'Pick the ripe tomatoes', sprite: 'tomato' } }
```
Set the sliders, press Grow: days tick by (sun/moon arc, day counter); a procedurally drawn plant grows (stem,
leaves, flowers, fruit) and its look shows health (yellow leaves = low nutrients, droop = too little water,
leggy = low sun, brown tips = wrong pH). Events pause the clock until the child taps the fix. Health meter
0–100; stars from final health (≥80 → 3★, ≥55 → 2★). Harvest animation at the end.

### 2.7 `calc` — a picture problem with working
```js
{ type: 'calc', title, mission,
  scene: 'garden-bed' | 'seed-tray' | 'market' | 'water' | 'animal' | 'plank' | 'shop' | 'recipe' | 'generic',
  givens: [ { key: 'sown', label: 'Seeds sown', value: 50, unit: 'seeds', sprite?: 'seed' }, … ],
  inputs?: [ { key: 'price', label: 'Price per bunch', min: 5, max: 50, step: 1, value: 20, unit: '₹' } ], // sliders
  questions: [ { ask: 'What is the germination percentage?', answer: '(sprouted / sown) * 100', unit: '%',
                 tolerance: 0.5, hint: 'Divide sprouted by sown, then multiply by 100.',
                 working: ['42 ÷ 50 = 0.84', '0.84 × 100 = 84%'] } ] }                  // 1–3 questions, in order
```
`answer` is an expression over givens/inputs keys (see `evalExpr`). Draw the scene with the givens (e.g. 50
seeds in a tray, 42 sprouting with a pop animation; a garden bed with length/width dimension lines; a market stall
with price tags; buckets of water; an animal with a girth tape). Child types the answer (on-screen number pad on
touch). Wrong: hint, then reveal working step by step on the 2nd miss. Right: the working animates in.

### 2.8 `chart` — collect data, build a chart, answer
```js
{ type: 'chart', title, mission, kind: 'bar' | 'pie' | 'pictograph',
  categories: [ { key: 'tap', label: 'Leaking taps', sprite?: 'leaking-tap', color?: 'teal' }, … ],  // 3–6
  collect: [ 'tap', 'tap', 'bucket', … ]  // the stream of observations to tally (8–20), OR
  values?: { tap: 5, bucket: 3 },         // skip collection and go straight to the chart
  questions: [ { ask: 'Which wastes the most water?', answer: 'tap' /* a category key */ | 12 /* a number */ } ] }
```
Observations arrive one at a time as cards (with art); the child taps the matching category; tally marks build
up (five-bar gates). Then the chart grows (animated bars / pie / pictograph icons). Then multiple-choice questions.

### 2.9 `choice` — a story with choices (role-play, interview, customer service)
```js
{ type: 'choice', title, mission, place?: 'farm' | 'market' | 'school' | 'museum' | 'clinic' | 'home' | 'shop' | 'stage' | 'village',
  cast: [ { id: 'farmer', name: 'Ramesh ji', sprite: 'farmer' }, { id: 'me', name: 'You', sprite: 'girl' } ],
  start: 'a',
  nodes: { a: { who: 'farmer', say: 'Namaste! What would you like to know?',
                choices: [ { text: 'Which tools do you use every day?', to: 'b', good: true, feedback: 'A clear, open question.' },
                           { text: 'Is farming boring?', to: 'a2', good: false, feedback: 'That could sound rude. Ask about the work.' } ] },
           b: { who: 'farmer', say: '…', next: 'c' },           // next: continue without choosing
           end: { end: true, say: 'Thank you for visiting!', stars?: 3 } } }
```
Visual-novel layout: place backdrop, characters (sprites) that bob when talking, speech bubbles typed out
letter by letter, choice buttons. Bad choices count a mistake and show feedback, then let the child try again
(unless `to` leads elsewhere). Complete on an `end` node.

### 2.10 `explore` — find things in a scene
```js
{ type: 'explore', title, mission,
  scene: 'garden' | 'campus' | 'kitchen' | 'farm' | 'street' | 'museum' | 'home' | 'park' | 'pond' | 'bicycle' | 'workshop' | 'market' | 'bathroom',
  tool: 'magnifier' | 'tap' | 'camera',
  hotspots: [ { x: 32, y: 60, label: 'Ladybird', sprite: 'ladybird', fact: 'Eats aphids, a friend of farmers.', hidden?: true, size?: 1 } ], // x,y in % of the scene
  find?: 6 }   // how many to find (default: all)
```
Draw a rich scene for the preset (sky, ground, objects). Hotspot sprites are placed at x/y; `hidden` ones are
tiny/camouflaged and only show under the magnifier lens (drag the lens; it magnifies) or the camera viewfinder
(tap to snap: flash + polaroid drops into an album). Each find opens a fact card and fills a "notebook" strip.
For `bicycle`/`workshop` scenes, hotspots are parts to identify (label shown after tapping).

### 2.11 `design` — make a poster, label or card (saved to portfolio)
```js
{ type: 'design', title, mission,
  canvas: 'poster' | 'label' | 'card' | 'menu' | 'badge' | 'banner',
  size?: [600, 800],
  palette?: ['#1F6F66', '#D98A1C', '#8C3557', '#4C7424', '#FFF9EF'],
  stickers: [ { sprite: 'tomato' }, { emoji: '🌿' }, … ],    // 6–16
  texts?: [ 'Fresh from our school garden!', '₹20 a bunch' ], // suggestions the child can add and edit
  fields?: [ { key: 'name', label: 'Product name' }, { key: 'price', label: 'Price' } ],   // optional form that fills text
  checklist: [ { text: 'Add a catchy title', rule: 'text:1' }, { text: 'Add at least 2 pictures', rule: 'stickers:2' },
               { text: 'Show the price', rule: 'contains:₹' }, { text: 'Choose a background colour', rule: 'background' } ] }
```
An editor: background colour swatches, add text (editable, font size, colour), add stickers (drag, resize with a
handle, rotate), delete, layer order. Checklist ticks live (rules: `text:N`, `stickers:N`, `contains:<text>`,
`background`, `field:<key>`). "Save to my portfolio" renders the design to a PNG (SVG → canvas) and calls
`api.savePortfolio(dataUrl, title)`, then completes.

### 2.12 `train` — teach a computer to recognise things (Teachable Machine style)
```js
{ type: 'train', title, mission,
  classes: [ { key: 'ripe', label: 'Ripe mango', samples: [ { sprite: 'mango' }, { emoji: '🥭' } ], tint?: '#F2B33D' }, … ], // 2–3
  tests: [ { sprite: 'mango', tint?: '#7BB342', truth: 'unripe' }, … ],   // 4–8
  minSamples: 6 }
```
A "camera" panel shows sample variations passing by (rotated, scaled, tinted, different backgrounds); the child
holds "Capture" to add samples to a class. "Train" runs an animated neural network (nodes pulse, epochs counter,
accuracy curve). Accuracy depends on samples per class and balance. "Test" shows each test item with prediction
and confidence bars; poor training gives wrong guesses and a hint to add more varied samples. Complete when
test accuracy ≥ 75%.

### 2.13 `physics` — simple machines with real physics (Matter.js)
```js
{ type: 'physics', title, mission,
  preset: 'catapult' | 'balloon-car' | 'ramp' | 'lever' | 'pulley' | 'windmill' | 'wheel-axle' | 'propeller-boat',
  params: [ { key: 'arm', label: 'Arm length', min: 1, max: 5, step: 1, value: 3, unit: '' }, … ],  // preset-specific
  goal: { text: 'Land the ball in the basket', target?: { x: 0.8, width: 0.08 } /* fraction of world width */,
          kind: 'hit' | 'distance' | 'lift' | 'spin' | 'least-force' },
  tries?: 5 }
```
`meta.needs: ['matter']`. Each preset is a small, beautiful world (canvas with gradient sky, ground texture,
wooden/cardboard looking bodies) where the sliders change the machine: catapult (arm length, pull-back angle,
load), balloon car (balloon size, car mass, surface friction), ramp (angle, surface, load), lever (fulcrum
position, load, effort), pulley (number of pulleys, load), windmill (blade angle, wind speed), wheel-axle (wheel
radius vs axle radius), propeller boat (rubber-band twists). Launch/Run button; trails and dust effects; distance
read-out; stars by number of tries.

### 2.14 `circuit` — wire up electronics
```js
{ type: 'circuit', title, mission, board: 'simple' | 'breadboard' | 'arduino',
  parts: [ 'battery', 'switch', 'led', 'resistor', 'buzzer', 'motor', 'bulb', 'pir', 'ldr', 'arduino' ],  // palette
  goal: { text: 'Make the LED glow when the switch is on', needs: ['battery', 'switch', 'led', 'resistor'],
          check: 'closed-loop' | 'sensor-trigger',   // sensor-trigger: a cat walks past the PIR / the room goes dark for the LDR
          output: 'led' } }
```
Place parts on the board (drag from palette to sockets), draw wires between terminals (drag from terminal to
terminal, wires curve and are colour-coded), toggle the switch / power. Connectivity is checked as a graph:
current flows (animated dots along wires) only in a closed loop; LED glows with bloom, bulb lights, buzzer
vibrates with sound waves, motor spins. Missing resistor with LED → LED pops (gently) with a tip. For
`sensor-trigger`, a character/cat walks past or day turns to night to fire the sensor.

### 2.15 `blocks` — Scratch-style block coding
```js
{ type: 'blocks', title, mission, mode: 'maze' | 'dance' | 'sensor',
  grid?: [6, 5], start?: { x: 0, y: 4, dir: 'right' }, goal?: { x: 5, y: 0 },
  coins?: [[2, 4], [5, 2]], walls?: [[1, 3], [3, 1]],
  palette: [ 'move', 'turnLeft', 'turnRight', 'jump', 'repeat', 'say', 'wait', 'ifSensor', 'ledOn', 'ledOff', 'playSound' ],
  maxBlocks?: 8, sprite?: 'scratch-cat',
  sensor?: { label: 'Motion sensor', event: 'cat walks by' } }
```
Left: block palette (Scratch-like coloured, notched blocks); middle: script area (drag blocks to snap into a
stack; `repeat` is a C-block that wraps blocks with a count); right: stage. Run animates the sprite step by
step with the active block highlighted. `maze`: reach the goal collecting coins, avoiding walls. `dance`: make
the sprite perform a target pattern (e.g. move, turn, say). `sensor`: build "when motion detected → LED on, wait,
LED off" logic and test it with a cat walking past.

---------------------------------------------------------------------------------------------------

## 3. Sprite catalogue

Every sprite: a 100×100 viewBox, friendly flat illustration with a soft highlight and a subtle shadow ellipse
under objects that stand on the ground; readable at 40px and lovely at 160px; works on light and dark cards
(natural object colours, dark outlines kept to `#2B1A10`-ish browns at ~2–3px only where needed). No text inside
sprites (except tiny numerals on meters). Unique ids inside a sprite must be prefixed with the sprite name.
Values are SVG markup **without** the outer `<svg>`.

**sprites-life.js** — seed, seed-packet, seedling, sapling, plant-pot, soil-bag, compost, compost-bin, earthworm,
kitchen-waste, dry-leaves, cow-dung, mulch, neem-leaves, tomato, tomato-plant, spinach, lettuce, cabbage, carrot,
radish, chilli, brinjal, okra, beans, peas, coriander, mint, tulsi, marigold, hibiscus, rose, sunflower, onion,
potato, garlic, ginger, mango, unripe-mango, apple, banana, orange, lemon, cucumber, grapes, papaya, coconut,
tree, neem-tree, bamboo-plant, grass, flower, leaf, peepal-leaf, roots, sprouts, microgreens, cocopeat, net-pot,
sun, moon, cloud, rain, water-drop, bee, butterfly, ladybird, aphid, caterpillar, ant, snail, spider, frog,
sparrow, sunbird, myna, pigeon, peacock, squirrel, lizard, fish, cow, calf, goat, hen, chick, buffalo, sheep,
fodder, hay, feed-bag, egg, milk-can, water-trough, nest, bird-bath, insect-hotel, beehive, mushroom, weed

**sprites-make.js** — trowel, spade, hand-fork, hoe, rake, shears, watering-can, wheelbarrow, gloves,
spray-bottle, magnifier, ruler, measuring-tape, weighing-scale, thermometer, ph-strip, ph-meter, seedling-tray,
shade-net, label-tag, bucket, mug, tap, leaking-tap, pipe, water-meter, water-tank, shower, toilet,
washing-machine, rain-barrel, lever, pulley, wheel-axle, inclined-plane, wedge, screw, gear, spring,
rubber-band, balloon, plastic-bottle, straw, ice-cream-stick, cardboard, glue, scissors, tape, catapult,
toy-car, balloon-car, propeller-boat, windmill, bicycle, tyre, air-pump, spanner, screwdriver, pliers, oil-can,
bicycle-chain, bicycle-bell, hammer, nail, saw, chisel, hand-drill, sandpaper, wood-plank, bamboo-pole, clamp,
try-square, varnish, pen-stand, cloth, thread, dye-pot, rubber-gloves, tongs, iron, turmeric, beetroot,
onion-skins, indigo, battery, led, bulb, switch, wire, resistor, buzzer, motor, fan, pir-sensor, ldr, arduino,
breadboard, relay, computer, laptop, tablet, smartphone, webcam, robot, keyboard, code-block, scratch-cat,
air-pump-aquarium, grow-light, nutrient-bottle, pvc-pipe

**sprites-people.js** — girl, boy, teacher, farmer, gardener, shopkeeper, customer, grandmother, grandfather,
doctor, vet, nurse, artisan, carpenter, mechanic, chef, puppeteer, family, house, school, shop, market-stall,
barn, museum-building, clinic, clay-pot, old-coin, old-photo, diya, display-case, label-card, old-radio,
textile, statue, bowl, plate, glass, knife, chopping-board, spoon, apron, chef-cap, soap, handwash, lunchbox,
sandwich, fruit-salad, lemonade, sprout-salad, curd, poha, chikki, sugar, salt, jaggery, first-aid-kit,
stethoscope, heart, toothbrush, mask, pill, calendar, clipboard, notebook, pencil, camera, poster, megaphone,
newspaper, tv, billboard, logo, price-tag, rupee-note, coin, money-bag, shopping-bag, pickle-jar, product-box,
star-badge, trophy, idea-bulb, speech-bubble, sock-puppet, paper-bag-puppet, stick-puppet, finger-puppet,
puppet-stage, script, microphone, clock, check, cross, question, recycle, dustbin

(`mascot` is drawn in sprites.js.)

---------------------------------------------------------------------------------------------------

## 4. Lesson files (content)

`assets/js/data/lessons/<pid>.js`, one per project (pid like `g6p1`):
```js
// Grade 6 · Project 1 · School Kitchen Garden — lessons and virtual labs.
// Written by VINC Lab in our own words from the Kaushal Bodh activity. Not a copy of the textbook.
export const FORM = 'life';                       // the project's form of work: life | machines | services
export const LESSONS = {
  1: {                                            // keyed by activity number n, same as the course file
    intro: '2–3 sentences: what this activity is and why it matters (speak to the child: "you").',
    time: '2 periods', group: 'Groups of 4–5', where: 'School garden',   // short strings
    need: [ 'Notebook and pencil', 'Measuring tape', … ],                // materials for THIS activity (3–8)
    steps: [ { t: 'Short step title', d: 'One or two clear sentences for a Grade 6–8 child.' }, … ], // 4–9 steps
    safety: [ 'Wear gloves when …' ],                                     // 0–4
    record: { title: 'My observations', cols: [ 'Date', 'Plant', 'Height (cm)', 'Notes' ], rows: 5 },  // or null
    think: [ 'A question to think about or discuss', … ],                 // 2–3
    fact: 'One surprising, true fact related to the activity.',
    lab: { type: '…', title: '…', mission: '…', … }                       // one config from §2
  },
  …
};
```
Writing rules: simple English (Grade 6–8, many second-language readers), active voice, short sentences, Indian
context (₹, local plants and foods, Hindi names in brackets where helpful). Follow what the book actually asks
the child to do, step by step, so they do not need the book open — but in **our own words**: do not copy the
textbook's sentences. Facts must be true. The lab should practise the core idea of that activity and feel like
a game, not a quiz; vary the lab types across a project.
