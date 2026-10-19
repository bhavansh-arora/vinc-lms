# VINC Lab · Kaushal Bodh LMS

A learning platform for NCERT's **Kaushal Bodh** skill-education books, which CBSE
asks every school to use in Grades 6–8 (Circular Skill-81/2025). All three grades
are built: 18 projects, 144 activities, 180 quiz questions.

It is a static site with no build step: plain HTML, CSS and JavaScript modules.
Light and dark mode follow the device setting automatically.

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
- **Dashboards**: tabbed previews of the student, parent, teacher and school dashboards, each with a button that
  opens sign-up for that role.
- **Grades 6 to 8**: one card per grade with its projects and a link to
  student sign-up.
- **For schools**: type a school name and pick a colour to preview the branded
  student app, then register the school with that name and colour.
- **Also on the page**: a learning-outcomes explorer, the roadmap, FAQ, and a
  pilot request form.

### Logins and sign-up
- Everyone logs in with a **User ID** (like `aarav.sharma`) and a **password**.
  The User ID is case-insensitive; an email on the profile also works.
- **Create account** works for students, parents, teachers and schools. Each form asks for basic profile
  details and suggests a User ID from the name, with a live availability check
  and a password-strength meter:
  - **Student**: name, school, class and section, optional date of birth and email.
  - **Parent**: name, relation, mobile, optional email, and the child's
    **family code** (shown on the student's Profile page).
  - **Teacher**: name, school, the school's **joining code** (shown to the
    coordinator on the Teachers page), the sections they teach, email.
  - **School**: school name, city, board, coordinator's name and email, brand
    colour. The school is set up with sections 6 A, 7 A and 8 A.
- **Profile** page for every role: edit name, User ID, email and mobile, change
  the password, see or renew the family code or joining code, and (for
  parents) link another child.
- **Managing accounts** (the **Accounts** page):
  - The **admin** can add, reset and delete anyone: coordinators, teachers,
    students and parents in every school. The admin can also delete a whole
    school (typing its name to confirm), which removes all its accounts and work.
  - A **school coordinator** can do the same for their own school's teachers,
    students and parents.
  - **Adding**: one form for every role. A student can get a parent login at the
    same time; a parent is linked to one or more students; a teacher can be
    given sections. The new User IDs and **temporary passwords** are shown once.
  - **Passwords**: make a temporary password (the person chooses a new one at
    their next login) or set a specific one, with or without asking them to
    change it.
  - **Deleting**: a student's work goes with them, and parent logins linked only
    to that student are deleted too (this can be unticked). A deleted teacher's
    sections are left without a teacher. Deleted accounts cannot log in.
  - The same actions are on the Teachers and Students pages and on each
    student's page. Teachers can reset student and parent passwords but cannot
    add or delete anyone. "Forgot password?" on the login screen explains who to
    ask.
- A paused school's users cannot log in.

### Motion
Pages build in with a short staggered entrance, bars and rings fill, and
numbers count up. When something changes on the same page (marking work,
filtering, finishing an activity) bars, rings and numbers glide to their new
values instead of replaying the entrance. The active page is marked by a pill
that slides between menu items. Dialogs, toasts, the mobile menu and
accordions open and close smoothly. All of it is switched off for people who
ask their device for reduced motion.

### LMS dashboards
- **Student**:
  - The three projects their section is doing.
  - Activities, each with a full lesson inside the portal (no need to switch to
    the textbook) and a virtual lab to play, plus a written reflection.
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
  - Teachers: add, delete and reset teachers, and assign sections (one teacher
    per section). **Classes and their teachers** lists every class with a
    "Change teacher" button (also on the Year plan): pick another teacher at the
    school, make a new teacher, or leave the class without one for now. Only the
    link changes: students' work, scores, lab stars, marks, feedback, the year
    plan and the lessons already taught all stay with the class, and the new
    teacher sees them straight away.
  - One-tap marking of the viva, observation and portfolio rubrics, plus feedback.
  - Students list (add, delete and reset students; add parents from a
    student's page).
  - Accounts: every teacher, student and parent in the school.
  - Year plan per section (projects from that section's grade), new sections,
    and the Mela date.
  - Reports with CSV export.
  - Branding: name, studio name, badge letters and colour, applied to every
    student and parent screen.
- **Admin (VINC)**: network KPIs, weekly activity and per-grade figures, schools
  (add, pause, delete, open a school's dashboard; new schools get 6 A, 7 A, 8 A
  and a teacher), Accounts for everyone on VINC Lab, the Grade 6–8 content and question banks, and data export or
  delete.

### Lessons and virtual labs
Every activity in Grades 6–8 (144 in all) has its own page in the student
portal:
- **The lesson**: what you'll do, time, group size and place, what you need,
  numbered steps to tick off, safety notes, a record table to fill in, "Think
  about it" questions and a "Did you know?" fact. Ticks and the record table
  save as the student types. The book page stays as a small reference chip.
- **A virtual lab**: a short game version of the activity with a mission card,
  a guide called Vinci, sounds (with mute), up to 3 stars and confetti. Stars are
  saved, shown on the activity list, and earn the "Lab explorer" and "Lab star"
  badges. Designs made in a lab can be saved to the portfolio.
- **Teachers** can open any lesson in full and play any lab from Lesson plans,
  and see what share of the class has played it. Student pages for teachers,
  schools and parents show labs played and stars.

The 15 lab types are reusable; each activity picks one and fills it with its
own content:

| Type | What the child does |
|---|---|
| sort | Drag items into bins, baskets and crates |
| sequence | Put steps in order on a conveyor |
| match | Join pairs with ropes |
| layers | Build a pit, bin or filter layer by layer |
| mix | Mix ingredients to hit a target (colour, pH, amounts) |
| grow | Grow a plant over days, fixing problems that pop up |
| calc | Work out a sum from a scene, with chalkboard working |
| chart | Tally observations, then draw bar, pie or picture charts |
| choice | Talk to a character and choose good questions and replies |
| explore | Find things in a scene with a magnifier or camera |
| design | Make a poster, label or card and save it |
| train | Collect samples, train a small AI model and test it |
| physics | Change a machine (catapult, lever, pulley, car...) and test it |
| circuit | Wire batteries, switches, LEDs and sensors |
| blocks | Snap code blocks to move a character or run a sensor |

Labs use GSAP (with Draggable and MotionPath) for animation and Matter.js for
physics, both stored in `assets/vendor/` and loaded only when a lab opens. The
art is 300+ hand-made SVG sprites.

The lesson text is written in VINC Lab's own words from the Kaushal Bodh
activities, not copied from the books.

### Assessment
Each project is marked on the split CBSE suggests: written test 10%, viva 30%,
activity book 30%, portfolio 10%, teacher observation 20%. Quizzes and the
activity book are marked automatically, and teachers mark the rubrics. The year
score is the average of the three projects. The bands (Exemplary 85+,
Proficient 70+, Developing 50+, Beginning) are VINC Lab's own.

## Accounts
The site starts empty: there are no sample schools or demo accounts, only the
VINC Lab admin.

**Where data lives.** The app works in two ways and picks one by itself when it
starts:
- **On the VINC Lab server** (the real setup, see [DEPLOY.md](DEPLOY.md)): logins
  are checked on the server and all data is kept in PostgreSQL, so the same
  accounts work in every browser and on every device. Each person only receives
  what their role allows. See [server/README.md](server/README.md).
- **On plain static hosting** (for example GitHub Pages, or the preview below):
  everything is stored in that browser (`localStorage`). Accounts made in
  Safari are then not in Chrome or on another device.

In the browser-only mode, within one browser:
- **Tabs stay in step.** When one tab saves, the others pick it up and redraw
  (waiting until any open dialog closes). Before saving, a tab merges in what
  other tabs saved, record by record, so a tab opened earlier can no longer
  overwrite people another tab just added.
- **Each tab has its own login**, so you can be the admin in one tab and a
  student in another. A new tab starts as whoever logged in last.
- Accounts made under the previous version of the app (stored as
  `vinclab:db:v3`) are carried over; its demo schools and demo logins are not.

**VINC Lab admin.** The admin is not shown on the landing page or offered on the
login and sign-up screens, but works in the background: log in on the normal
login screen with User ID `admin` and password `Qwerty@21`, then change the
password on the profile page. Admin accounts cannot be created through sign-up.

Setting up a school, in order:
1. **School**: the coordinator registers the school on the sign-up page (or the
   admin adds it on the Schools page). It starts with sections 6 A, 7 A and 8 A
   and gets a teacher joining code, shown on its Teachers page.
2. **Teachers** sign up, choose the school, enter the joining code and pick their
   sections. The coordinator can also add teachers and change sections.
3. **Students** sign up and choose their school and class, or the coordinator
   adds them on the Students page (with a parent login and temporary passwords).
4. **Parents** sign up with their child's family code, shown on the child's
   Profile page.

The admin's Settings page can export all data or delete it and start again.
`app.html#/signup` opens the sign-up form; `app.html#/signup/school` opens it
for a school.

## Structure

```
index.html, app.html
server/               Node.js server: API, logins, role checks, PostgreSQL storage, backups (server/README.md)
deploy/               install.sh, update.sh, uninstall.sh for the VPS (DEPLOY.md)
Dockerfile, docker-compose.yml   The app container
assets/logo/          VINC Lab logo (light, dark) and square mark
assets/css/           tokens.css (shared palette, dark mode), art.css, landing.css, app.css
assets/js/data/grade6.js   Grade 6 course, plus the shared forms of work, weights, rubrics and outcomes
assets/js/data/grade7.js, grade8.js   Grade 7 and 8 courses
assets/js/data/courses.js  One lookup for all grades (projectById, projectsOfGrade)
assets/js/art.js      Animated project illustrations and icons
assets/js/landing.js  Landing page behaviour
assets/js/app/        main.js (router, shell, page transitions), auth.js (log in and sign up),
                      store.js (data, logins), sha256.js, scoring.js, ui.js
assets/js/app/views/  student, parent, teacher, school, admin, profile; shared.js holds marking,
                      heatmaps, class analytics and password resets used by teachers and schools;
                      activity.js is the student activity page (lesson + lab);
                      accounts.js is the Accounts page with add, password and delete dialogs
assets/js/data/lessons/   One file per project (g6p1.js ... g8p6.js): the lesson and lab for each activity
assets/js/app/lab/    runtime.js (the lab player), kit.js (shared helpers), sprites*.js (SVG art),
                      types/ (one file per lab type), SPEC.md (how to write a lesson or a lab type)
assets/css/lab.css, assets/css/lab/   Lab player styles and one stylesheet per lab type
assets/vendor/        GSAP 3.13 and Matter.js 0.20, with their licences
lab-dev.html          Developer page: ?type=sort opens a sample of that lab type, ?lesson=g6p1&n=3 opens a lesson's lab
```

Each course file has the same shape: projects with activities (title, page,
task), goals, materials, safety, careers, viva prompts and a 10-question quiz.

## Preview locally

Browser-only mode (no server):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

With the server and a local PostgreSQL database: see [server/README.md](server/README.md).
ES modules need a web server; opening the files directly will not work.

## Deploy
The real setup runs on the VPS in Docker, with its own database in the shared
PostgreSQL: follow [DEPLOY.md](DEPLOY.md) (one command; `deploy/install.sh`).
Updates: `sudo bash /opt/vinclab/deploy/update.sh`.

Any static host (GitHub Pages, Netlify, Cloudflare Pages, S3) still works for a
browser-only preview.

## Before going live
- **Server**: done (`server/`, `DEPLOY.md`): server-side logins with scrypt
  password hashes, role-based access, PostgreSQL storage and backups every 3 hours.
  The browser-only mode is for previews only: there, passwords are checked in
  the browser and protect nothing on a shared computer.
- **Admin password**: change `Qwerty@21` after the first login on the server.
- **Photos**: portfolio photos are stored inside the database (shrunk to about
  560 px). With many schools, moving them to file storage would keep the
  database small.
- **Pilot form**: requests go to info@vinc-lab.com through FormSubmit.
  The first submission sends an activation email that must be confirmed once.
- **Content**: project titles, page numbers and periods follow the 2026–27
  Kaushal Bodh Grade 6, 7 and 8 books. Summaries, quizzes and viva prompts are VINC Lab's
  own. Have a teacher review them.
- **Lessons**: written from the books in our own words. A teacher should check
  them, in particular: the ORS step (the lesson says to follow the packet), the
  burns advice (it adds "cool under running water, no ice", which goes beyond
  the book), the LED resistor (the lesson gives 220–470 Ω rather than only
  220 Ω on 9 V), and the cattle weight formula (the book's ÷330 gives about
  twice the real weight, so the lab uses the goat formula and says to check with
  the vet). Some "Did you know?" facts have not been checked against a source.
- **Licences**: GSAP is used under its free Standard No-Charge License and
  Matter.js under MIT (both in `assets/vendor/`).

Kaushal Bodh is published by NCERT. VINC Lab is independent and not affiliated
with NCERT or CBSE.
