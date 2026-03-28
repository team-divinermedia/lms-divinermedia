import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin.email);

  // Check if seed data already exists
  const existingCourse = await prisma.course.findFirst({
    where: { title: 'Introduction to Web Development' }
  });

  if (existingCourse) {
    console.log('Seed data already exists, skipping course creation.');
    return;
  }

  // Create a sample course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript.',
      isPublished: true,
      sortOrder: 1,
    },
  });

  console.log('Course created:', course.title);

  // Create Module 1
  const module1 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'HTML Fundamentals',
      description: 'Learn the basics of HTML markup language.',
      sortOrder: 1,
    },
  });

  // Create Module 2
  const module2 = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'CSS Styling',
      description: 'Learn how to style web pages with CSS.',
      sortOrder: 2,
    },
  });

  console.log('Modules created:', module1.title, ',', module2.title);

  // Create 3 lessons for Module 1
  const lesson1_1 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Introduction to HTML',
      description: 'What is HTML and why is it important?',
      videoUrl: 'https://example.com/videos/html-intro.mp4',
      notes: 'HTML stands for HyperText Markup Language. It is the standard language for creating web pages.',
      resources: JSON.stringify([
        { name: 'MDN HTML Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
      ]),
      sortOrder: 1,
      isPublished: true,
    },
  });

  const lesson1_2 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'HTML Elements and Tags',
      description: 'Understanding HTML elements, tags, and attributes.',
      videoUrl: 'https://example.com/videos/html-elements.mp4',
      notes: 'HTML elements are defined by tags. Tags usually come in pairs: opening and closing tags.',
      resources: JSON.stringify([
        { name: 'HTML Element Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element' },
      ]),
      sortOrder: 2,
      isPublished: true,
    },
  });

  const lesson1_3 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'HTML Forms and Inputs',
      description: 'Creating interactive forms with HTML.',
      videoUrl: 'https://example.com/videos/html-forms.mp4',
      notes: 'HTML forms are used to collect user input. The <form> element wraps form controls.',
      resources: JSON.stringify([
        { name: 'HTML Forms Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form' },
      ]),
      sortOrder: 3,
      isPublished: true,
    },
  });

  // Create 3 lessons for Module 2
  const lesson2_1 = await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'Introduction to CSS',
      description: 'What is CSS and how does it work with HTML?',
      videoUrl: 'https://example.com/videos/css-intro.mp4',
      notes: 'CSS (Cascading Style Sheets) is used to style and layout web pages.',
      resources: JSON.stringify([
        { name: 'MDN CSS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
      ]),
      sortOrder: 1,
      isPublished: true,
    },
  });

  const lesson2_2 = await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'CSS Selectors and Properties',
      description: 'Learn about CSS selectors and commonly used properties.',
      videoUrl: 'https://example.com/videos/css-selectors.mp4',
      notes: 'CSS selectors are used to target HTML elements. Properties define the styles to apply.',
      resources: JSON.stringify([
        { name: 'CSS Selectors Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors' },
      ]),
      sortOrder: 2,
      isPublished: true,
    },
  });

  const lesson2_3 = await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'CSS Flexbox and Grid',
      description: 'Modern CSS layout techniques using Flexbox and Grid.',
      videoUrl: 'https://example.com/videos/css-layout.mp4',
      notes: 'Flexbox and Grid are powerful CSS layout systems for creating responsive designs.',
      resources: JSON.stringify([
        { name: 'Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
        { name: 'Grid Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/' },
      ]),
      sortOrder: 3,
      isPublished: true,
    },
  });

  console.log('Lessons created: 6 total (3 per module)');

  // Create assessment for lesson 1_1 (lesson-level)
  await prisma.assessment.create({
    data: {
      lessonId: lesson1_1.id,
      title: 'HTML Basics Quiz',
      description: 'Test your knowledge of HTML fundamentals.',
      isPublished: true,
      sortOrder: 1,
      questions: {
        create: [
          {
            type: 'mcq',
            content: 'What does HTML stand for?',
            options: JSON.stringify([
              'Hyper Text Markup Language',
              'High Tech Modern Language',
              'Hyper Transfer Markup Language',
              'Home Tool Markup Language',
            ]),
            correctAnswer: 'Hyper Text Markup Language',
            sortOrder: 1,
          },
          {
            type: 'true_false',
            content: 'HTML is a programming language.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'False',
            sortOrder: 2,
          },
          {
            type: 'short_answer',
            content: 'What tag is used to create a hyperlink in HTML?',
            correctAnswer: '<a>',
            sortOrder: 3,
          },
        ],
      },
    },
  });

  // Create assessment for Module 1 (module-level)
  await prisma.assessment.create({
    data: {
      moduleId: module1.id,
      title: 'HTML Module Assessment',
      description: 'Comprehensive assessment for the HTML Fundamentals module.',
      isPublished: true,
      sortOrder: 1,
      questions: {
        create: [
          {
            type: 'mcq',
            content: 'Which HTML element is used to define an unordered list?',
            options: JSON.stringify(['<ol>', '<ul>', '<li>', '<list>']),
            correctAnswer: '<ul>',
            sortOrder: 1,
          },
          {
            type: 'mcq',
            content: 'Which attribute is used to specify a unique identifier for an HTML element?',
            options: JSON.stringify(['class', 'id', 'name', 'key']),
            correctAnswer: 'id',
            sortOrder: 2,
          },
          {
            type: 'long_answer',
            content: 'Explain the difference between block-level and inline elements in HTML. Give examples of each.',
            correctAnswer: '',
            sortOrder: 3,
          },
        ],
      },
    },
  });

  // Create assessment for lesson 2_1
  await prisma.assessment.create({
    data: {
      lessonId: lesson2_1.id,
      title: 'CSS Basics Quiz',
      description: 'Test your knowledge of CSS fundamentals.',
      isPublished: true,
      sortOrder: 1,
      questions: {
        create: [
          {
            type: 'mcq',
            content: 'What does CSS stand for?',
            options: JSON.stringify([
              'Cascading Style Sheets',
              'Creative Style System',
              'Computer Style Sheets',
              'Colorful Style Sheets',
            ]),
            correctAnswer: 'Cascading Style Sheets',
            sortOrder: 1,
          },
          {
            type: 'true_false',
            content: 'CSS can be written inline, internally, or externally.',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
            sortOrder: 2,
          },
          {
            type: 'short_answer',
            content: 'What CSS property is used to change the text color of an element?',
            correctAnswer: 'color',
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('Assessments created: 3 total');

  console.log('\nSeed completed successfully!');
  console.log('Admin login: admin@lms.com / admin123');
}

seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
