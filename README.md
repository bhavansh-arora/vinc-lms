# VINC Lab · Kaushal Bodh LMS

A learning platform for NCERT's **Kaushal Bodh** skill-education books, which CBSE
asks every school to use in Grades 6–8 (Circular Skill-81/2025). Grade 6 is built.
Grades 7 and 8 come next.

It is a static site with no build step: plain HTML, CSS and JavaScript modules.

## What's here

| Page | What it does |
|---|---|
| `index.html` | The VINC Lab landing page |
| `app.html` | The LMS, with student, parent, school and admin dashboards |

### Landing page (interactive parts)
- **Hero**: bubbles and a node network drift behind the page and lean toward the
  pointer. The three forms of work orbit the VINC Lab funnel; tap one to see its
  Grade 6 projects.
- **Grade 6 course**: six animated project cards. Filter by form of work, or open
  a card for its activities (with textbook pages), materials, safety, careers and
  assessment.
- **Plan the year**: pick one project per form of work and see the year laid out
  in periods and weeks, ending with the Kaushal Mela.
- **Assessment**: sliders and a donut chart showing how the CBSE five-part split
  adds up to one score.
- **Dashboards**: tabbed previews of the four dashboards, each with a button that
  opens that role in the demo.
- **For schools**: type a school name and pick a colour to preview the branded
  student app, then open a full demo under that brand.
- **Also on the page**: a learning-outcomes explorer, the roadmap, FAQ, and a
  pilot request form.

### LMS dashboards
- **Student**:
  - The three projects their section is doing.
  - Activities with textbook page references and a written reflection for each.
  - A 10-question quiz per project with instant feedback.
  - A portfolio for notes and photos.
  - Scores in the five CBSE parts, viva practice questions, badges and a Mela
    countdown.
- **Parent**: the child's progress, the last two weeks of work and reflections,
  portfolio, scores, teacher feedback and things to try at home.
- **School**:
  - Overview and a progress heatmap per section and project.
  - One-tap marking of the viva, observation and portfolio rubrics, plus feedback.
  - Students list (with adding students).
  - Year plan per section and the Mela date.
  - Reports with CSV export.
  - Branding: name, studio name, badge letters and colour, applied to every
    student and parent screen.
- **Admin (VINC)**: network KPIs and weekly activity, schools (add, pause, open
  a school's dashboard), the course content and question bank, and demo-data
  reset or export.

### Assessment
Each project is marked on the split CBSE suggests: written test 10%, viva 30%,
activity book 30%, portfolio 10%, teacher observation 20%. Quizzes and the
activity book are marked automatically, and teachers mark the rubrics. The year
score is the average of the three projects. The bands (Exemplary 85+,
Proficient 70+, Developing 50+, Beginning) are VINC Lab's own.

## Demo data
This preview has no server. Everything is stored in the visitor's browser
(`localStorage`) and seeded with three schools, five sections and 64 students.
The admin settings page resets or exports the data. Demo accounts are on the
login screen, and "View as" in the top bar switches between roles.

## Structure

```
index.html, app.html
assets/logo/          VINC Lab logo (light, dark) and square mark
assets/css/           tokens.css (shared palette, dark mode), art.css, landing.css, app.css
assets/js/data/grade6.js   Grade 6 course: projects, activities, pages, quizzes, viva prompts, rubrics
assets/js/art.js      Animated project illustrations and icons
assets/js/landing.js  Landing page behaviour
assets/js/app/        main.js (router, shell), store.js (demo data), scoring.js, ui.js, views/*.js
```

To add Grade 7 or 8, add a data file shaped like `grade6.js`. The views read
projects, activities and quizzes from it.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

ES modules need a web server; opening the files directly will not work.

## Deploy
Any static host works: GitHub Pages from the repository root, Netlify,
Cloudflare Pages or S3.

## Before going live
- **Backend**: replace `assets/js/app/store.js` with calls to a hosted database
  and real logins. The data shapes (schools, users, progress, log) carry over.
- **Pilot form**: requests go to vincdeeptech@gmail.com through FormSubmit.
  The first submission sends an activation email that must be confirmed once.
- **Content**: project titles, page numbers and periods follow the 2026–27
  Kaushal Bodh Grade 6 book. Summaries, quizzes and viva prompts are VINC Lab's
  own. Have a teacher review them.

Kaushal Bodh is published by NCERT. VINC Lab is independent and not affiliated
with NCERT or CBSE.
