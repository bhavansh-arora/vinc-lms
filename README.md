# VINC Lab · Kaushal Bodh LMS

A learning platform for NCERT's **Kaushal Bodh** skill-education books, which CBSE
asks every school to use in Grades 6–8 (Circular Skill-81/2025). All three grades
are built: 18 projects, 144 activities, 180 quiz questions.

It is a static site with no build step: plain HTML, CSS and JavaScript modules.

## What's here

| Page | What it does |
|---|---|
| `index.html` | The VINC Lab landing page |
| `app.html` | The LMS, with student, parent, teacher, school and admin dashboards |

### Landing page (interactive parts)
- **Hero**: bubbles and a node network drift behind the page and lean toward the
  pointer. The three forms of work orbit the VINC Lab funnel; tap one to see its
  Grade 6 projects.
- **Courses**: Grade 6, 7 and 8 tabs, each with six animated project cards.
  Filter by form of work, or open a card for its activities (with textbook
  pages), materials, safety, careers and assessment.
- **Plan the year**: pick a grade, then one project per form of work, and see
  the year laid out in periods and weeks, ending with the Kaushal Mela.
- **Assessment**: sliders and a donut chart showing how the CBSE five-part split
  adds up to one score.
- **Dashboards**: tabbed previews of the five dashboards, each with a button that
  opens that role in the demo.
- **Grades 6 to 8**: one card per grade with its projects and a link to a
  student demo in that grade.
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
- **Teacher** (new): only the sections the teacher is assigned to.
  - My classes: what to teach next in each section (with the textbook page and
    how much of the class has done it), "Mark as taught", grade summaries and
    students who need attention.
  - One page per grade: section switcher, project progress, class heatmap,
    quiz question analysis (which questions the class gets wrong), class
    averages on the work values (LO 12–17) and viva criteria, students to check
    on, and marking.
  - Lesson plans: each project split into double-period sessions and weeks, with
    a "taught" checkbox, class completion per activity, materials, safety and
    viva questions. Printable.
  - Mark work and My students, limited to the teacher's sections.
- **Parent**: a switcher for families with more than one child, then the child's progress, the last two weeks of work and reflections,
  portfolio, scores, teacher feedback and things to try at home.
- **School**:
  - Overview across Grades 6–8 with a grade filter, grade cards and a progress
    heatmap per section and project.
  - Teachers: add teachers and assign sections (one teacher per section).
  - One-tap marking of the viva, observation and portfolio rubrics, plus feedback.
  - Students list (with adding students).
  - Year plan per section (projects from that section's grade), new sections,
    and the Mela date.
  - Reports with CSV export.
  - Branding: name, studio name, badge letters and colour, applied to every
    student and parent screen.
- **Admin (VINC)**: network KPIs, weekly activity and per-grade figures, schools
  (add, pause, open a school's dashboard; new schools get 6 A, 7 A, 8 A and a
  teacher), the Grade 6–8 content and question banks, and demo-data reset or
  export.

### Assessment
Each project is marked on the split CBSE suggests: written test 10%, viva 30%,
activity book 30%, portfolio 10%, teacher observation 20%. Quizzes and the
activity book are marked automatically, and teachers mark the rubrics. The year
score is the average of the three projects. The bands (Exemplary 85+,
Proficient 70+, Developing 50+, Beginning) are VINC Lab's own.

## Demo data
This preview has no server. Everything is stored in the visitor's browser
(`localStorage`) and seeded with three schools, ten Grade 6–8 sections, four
teachers and 109 students. The admin settings page resets or exports the data.

Demo accounts (on the login screen; "View as" in the top bar switches roles):

| Role | Account |
|---|---|
| Student | Aarav Sharma (Grade 6), Meera Iyer (Grade 7), Ananya Sharma (Grade 8) |
| Parent | Priya Sharma, mother of Aarav and Ananya |
| Teacher | Anjali Menon, teaches 6 A, 7 A and 8 A at Greenwood |
| School | Kavita Rao, Kaushal Bodh coordinator at Greenwood |
| Admin | Neha Kapoor, VINC Lab |

Links like `app.html#/login/teacher` or `#/login/student7` open a role directly.

## Structure

```
index.html, app.html
assets/logo/          VINC Lab logo (light, dark) and square mark
assets/css/           tokens.css (shared palette, dark mode), art.css, landing.css, app.css
assets/js/data/grade6.js   Grade 6 course, plus the shared forms of work, weights, rubrics and outcomes
assets/js/data/grade7.js, grade8.js   Grade 7 and 8 courses
assets/js/data/courses.js  One lookup for all grades (projectById, projectsOfGrade)
assets/js/art.js      Animated project illustrations and icons
assets/js/landing.js  Landing page behaviour
assets/js/app/        main.js (router, shell), store.js (demo data), scoring.js, ui.js
assets/js/app/views/  student, parent, teacher, school, admin; shared.js holds marking,
                      heatmaps and class analytics used by teachers and schools
```

Each course file has the same shape: projects with activities (title, page,
task), goals, materials, safety, careers, viva prompts and a 10-question quiz.

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
  Kaushal Bodh Grade 6, 7 and 8 books. Summaries, quizzes and viva prompts are VINC Lab's
  own. Have a teacher review them.

Kaushal Bodh is published by NCERT. VINC Lab is independent and not affiliated
with NCERT or CBSE.
