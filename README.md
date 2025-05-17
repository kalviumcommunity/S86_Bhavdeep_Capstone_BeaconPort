# BeaconPort: School-Student Management System

A modern MERN stack platform with Tailwind CSS, role-based dashboards, and scalable architecture.

## Project Overview

*Problem:* Managing large-scale student data, classes, and communication within schools is often inefficient and scattered across multiple tools.

*Solution:* BeaconPort provides a centralized digital system for school heads, teachers, and students with role-based access, and privacy.

### Key Features

- Role-Based Dashboards: Separate portals for administrators, teachers, and students.
- Classroom Tools: Attendance tracking, grading, notices, and more.
- Modern UI: Developed using Tailwind CSS with a dark theme incorporating shades of orange and reddish-yellow.
- Secure Authentication: JWT-based login system for all roles.

## Tech Stack

*Frontend:* React.js (Vite), Tailwind CSS, Context API, React Router, Material UI  
*Backend:* Express.js (ESM), Node.js  
*Database:* MongoDB Atlas  
*Authentication:* JWT with role-based middleware  
*Deployment:* Vercel for the frontend, Render for the backend  
*UI Enhancements:* GSAP animations  

## 45-Day Development Plan

### Phase 1: Core Setup (Days 1-7)

| Day | Task                                       | Deliverable               | Testing               |
| --- | ------------------------------------------ | ------------------------- | --------------------- |
| 1   | Initialize Vite, React, Tailwind.          | Project scaffolded.       | npm run dev         |
| 2   | Setup MongoDB and Express (ESM).           | Connected backend.        | API testing.          |
| 3   | Implement JWT authentication.              | Login and protected routes. | Manual login flow.    |
| 4   | Create admin dashboard and school code generation. | Unique code stored in database. | UI and database verification. |
| 5   | Develop teacher onboarding system.         | Role-based school join flow. | Validation tests.     |
| 6   | Implement student onboarding via school/class codes. | Verified class joins.  | Validation and database checks. |
| 7   | Deploy backend to Render.                  | Live API functionality.   | Smoke testing.        |

### Phase 2: Core Functionality (Days 8–21)

| Day | Task                                       | Deliverable                    | Testing              |
| --- | ------------------------------------------ | ------------------------------ | -------------------- |
| 8   | Admin: Create and view schools.           | School list available in dashboard. | Database verification. |
| 9   | Teacher: Create and manage classes.       | Unique four-digit class codes generated. | Join validation.  |
| 10  | Student: Join classes using codes.        | Appears in class student list. | Manual testing.     |
| 11  | Implement notice board functionality.     | Posting and retrieval of notices. | Notice validation.  |
| 12  | Develop attendance tracking system.       | Checkbox-based student marking. | UI and database synchronization. |
| 13  | Create grading system for assignments.    | Subject-wise grade entry functionality. | Data integrity checks. |
| 14  | Student dashboard: Display grades and attendance. | Analytics-ready UI elements. | Test cases with mock data. |

### Phase 3: UI/UX Polish (Days 22–35)

| Day | Task                                      | Deliverable               | Testing                   |
| --- | ----------------------------------------- | ------------------------- | ------------------------- |
| 22  | Integrate Framer Motion for animations.  | Smooth transitions and fade-ins. | Visual inspection. |
| 23  | Implement dark theme.                    | Themed interface.         | Toggle functionality test. |
| 24  | Improve loading states with skeletons.   | Data-fetching indicators. | Performance throttling check. |
| 25  | Implement toast notifications.           | Feedback system integrated. | Simulated error handling. |
| 26  | Ensure responsive design compatibility.  | Mobile-first breakpoints. | Browser testing. |
| 27  | Develop sidebar and navigation system.   | Role-based navigation flows. | UI click tests. |

### Phase 4: Final Testing & Launch (Days 36–45)

| Day | Task                                       | Deliverable                        | Testing             |
| --- | ------------------------------------------ | ---------------------------------- | ------------------- |
| 36  | Secure routes using authentication middleware. | Enforced role-based access.   | JWT integrity checks. |
| 37  | Write unit tests using Jest.              | Backend validation logic.        | npm test execution. |
| 38  | Perform end-to-end testing using Cypress. | Validate student journey.        | User flow testing. |
| 39  | Implement MongoDB rules and rate limits.  | Secured database access.         | Injection prevention tests. |
| 40  | Deploy final version of the application.  | Live platform accessible.       | Smoke testing. |
| 41  | Record demo walkthrough video.            | Presentation-ready recording. | Peer review session. |
| 42  | Write comprehensive documentation.        | Readme, screenshots, and API usage guidelines. | Code review. |
| 43  | Final debugging and fixes.                | Fully functional application. | System-wide checks. |

## Design Philosophy

*Colors*:  
- Background: #1a1a1a  
- Accent: #FF7E33 / #FACC15  

*Typography*:  
- Inter for body text, Poppins for headings  

*Spacing*:  
- 16px base grid, four-column layout  

*Animations*:  
- Sidebar slide-in  
- Card hover zoom effects  
- Smooth form transitions  

## Installation Guide

1. Clone the repository:

bash
git clone https://github.com/kalviumcommunity/S86_Bhavdeep_Capstone_BeaconPort.git
cd BeaconPort


2. Install frontend and backend dependencies:

bash
# Frontend setup
cd client
npm install

# Backend setup
cd ../server
npm install


3. Set up environment variables using .env.example as a reference.

4. Run the application locally:

bash
# Backend server
cd server
npm run dev

# Frontend server
cd ../client
npm run dev


## Roles & Access Flow

| Role    | Access Privileges                             |
| ------- | --------------------------------------------- |
| Admin   | Create schools and manage teachers.           |
| Teacher | Join schools, create classes, and manage students. |
| Student | Join classes, view grades, and access notices. |

## Resources

- [Figma Design](https://www.figma.com/proto/b3bGHzl2NJMcO5B6rD0Aaf/Capstone-2?node-id=0-1&t=b8FMdqXl9tJ2jaxC-1)  
- [MongoDB Atlas Setup Guide](https://www.mongodb.com/docs/atlas/getting-started/)  
- [Vercel Deployment Documentation](https://vercel.com/docs)  
- [JWT Authentication Guide](https://jwt.io/introduction)