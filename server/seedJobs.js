/**
 * Safe, idempotent database seeder for DG Interns Hub sample internships.
 * 
 * - Seeds at least 10 realistic sample internship opportunities.
 * - Checks by (title, company) before inserting to avoid duplicates.
 * - Does not delete existing jobs.
 * - Uses or creates a default employer account to satisfy foreign key postedBy.
 */

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Job = require("./models/Job");

const SAMPLE_INTERNSHIPS = [
  {
    title: "Frontend Developer Intern",
    company: "DG Interns Solutions",
    location: "Remote",
    type: "Internship",
    skills: ["React", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
    salary: { min: 15000, max: 25000, currency: "INR" },
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days ahead
    description:
      "[Sample Opportunity] Work with modern React, component architecture, and responsive styling to craft interactive web applications for students and young professionals.",
    isActive: true,
  },
  {
    title: "Backend Developer Intern",
    company: "CloudScale Technologies",
    location: "Bangalore",
    type: "Internship",
    skills: ["Node.js", "Express", "MongoDB", "REST APIs", "JWT"],
    salary: { min: 18000, max: 28000, currency: "INR" },
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Develop scalable RESTful microservices, optimize MongoDB query pipelines, and implement secure token-based authentication workflows.",
    isActive: true,
  },
  {
    title: "Full Stack Developer Intern",
    company: "Nexus Digital Works",
    location: "Hyderabad",
    type: "Internship",
    skills: ["React", "Node.js", "Express", "MongoDB", "Git"],
    salary: { min: 20000, max: 32000, currency: "INR" },
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Gain hands-on full-stack development experience building end-to-end features spanning Vite/React frontends and Express backends.",
    isActive: true,
  },
  {
    title: "Python Developer Intern",
    company: "PyLogic Automations",
    location: "Pune",
    type: "Internship",
    skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Automation"],
    salary: { min: 16000, max: 26000, currency: "INR" },
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Build robust backend services and data automation scripts using Python, asynchronous frameworks, and modern relational databases.",
    isActive: true,
  },
  {
    title: "Java Developer Intern",
    company: "Enterprise Core Systems",
    location: "Chennai",
    type: "Internship",
    skills: ["Java", "Spring Boot", "MySQL", "REST APIs", "Maven"],
    salary: { min: 18000, max: 30000, currency: "INR" },
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Learn enterprise backend architecture with Java 17 and Spring Boot, assisting in writing robust unit tests and building clean endpoints.",
    isActive: true,
  },
  {
    title: "UI/UX Designer Intern",
    company: "Creative Studio Labs",
    location: "Remote",
    type: "Internship",
    skills: ["Figma", "Wireframing", "Prototyping", "User Research", "Design Systems"],
    salary: { min: 14000, max: 22000, currency: "INR" },
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Design wireframes, high-fidelity mockups, and interactive Figma prototypes while conducting qualitative usability tests with users.",
    isActive: true,
  },
  {
    title: "Data Analyst Intern",
    company: "InsightPulse Analytics",
    location: "Gurgaon",
    type: "Internship",
    skills: ["Python", "Pandas", "SQL", "PowerBI", "Data Visualization"],
    salary: { min: 16000, max: 24000, currency: "INR" },
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Extract, clean, and visualize complex datasets to derive actionable business insights and construct automated KPI dashboard reports.",
    isActive: true,
  },
  {
    title: "Machine Learning Intern",
    company: "Cognitive AI Labs",
    location: "Bangalore",
    type: "Internship",
    skills: ["Python", "PyTorch", "Scikit-Learn", "NLP", "Data Preprocessing"],
    salary: { min: 22000, max: 35000, currency: "INR" },
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Assist in training, evaluating, and fine-tuning predictive machine learning and natural language processing models for production.",
    isActive: true,
  },
  {
    title: "DevOps Engineer Intern",
    company: "InfraCloud Ops",
    location: "Remote",
    type: "Internship",
    skills: ["Docker", "Linux", "CI/CD", "GitHub Actions", "AWS"],
    salary: { min: 20000, max: 30000, currency: "INR" },
    deadline: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Help maintain cloud deployments, containerize applications with Docker, and construct automated continuous integration pipelines.",
    isActive: true,
  },
  {
    title: "Mobile App Developer Intern",
    company: "SwiftPulse Mobile",
    location: "Hyderabad",
    type: "Internship",
    skills: ["React Native", "Flutter", "JavaScript", "Mobile UI", "REST APIs"],
    salary: { min: 18000, max: 28000, currency: "INR" },
    deadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    description:
      "[Sample Opportunity] Build cross-platform mobile apps using React Native and Flutter with smooth screen navigation and real-time backend synchronization.",
    isActive: true,
  },
];

async function seedJobs() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");

    // Find or create a default employer account to own seeded jobs
    let employer = await User.findOne({ email: "employer@dginternshub.com" });
    if (!employer) {
      // Also check if any employer exists in the database
      employer = await User.findOne({ role: "employer" });
    }

    if (!employer) {
      console.log("Creating default employer account for seeded jobs...");
      const hashedPassword = await bcrypt.hash("EmployerPass123!", 12);
      employer = await User.create({
        name: "DG Interns Recruitment Team",
        email: "employer@dginternshub.com",
        password: hashedPassword,
        role: "employer",
      });
      console.log("Default employer account created:", employer.email);
    } else {
      console.log("Using existing employer account:", employer.email);
    }

    let insertedCount = 0;
    let existingCount = 0;

    for (const jobData of SAMPLE_INTERNSHIPS) {
      // Check if job with same title and company already exists
      const existing = await Job.findOne({
        title: jobData.title,
        company: jobData.company,
      });

      if (existing) {
        existingCount++;
      } else {
        await Job.create({
          ...jobData,
          postedBy: employer._id,
        });
        insertedCount++;
        console.log(`+ Seeded: "${jobData.title}" at ${jobData.company}`);
      }
    }

    console.log("\n================ SEED SUMMARY ================");
    console.log(`New internships inserted: ${insertedCount}`);
    console.log(`Already existing (skipped): ${existingCount}`);
    console.log(`Total sample batch size: ${SAMPLE_INTERNSHIPS.length}`);

    const totalJobsInDb = await Job.countDocuments({ isActive: true });
    console.log(`Total active jobs now in database: ${totalJobsInDb}`);
    console.log("===============================================\n");

    await mongoose.disconnect();
    console.log("MongoDB disconnected cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding internships:", err);
    process.exit(1);
  }
}

seedJobs();
