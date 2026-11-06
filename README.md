# CivicPulse India

Build a responsive full-stack web application named CivicAI – Smart Civic Intelligence and Accountability Platform.

The application addresses public infrastructure problems in Indian cities and villages.

Technology:

- React frontend with Tailwind CSS.

- Python Django REST Framework backend.

- PostgreSQL database.

- Modular Python AI processing engine.

Create three user roles:

1. Citizen: registration, login, text complaints, photograph upload, voice recording, complaint tracking and community confirmation.

2. Field Inspector: assigned inspections, manual problem recording, optional photographs, offline storage and synchronization.

3. Administrator: complaint analytics, map, inspector management, department assignments, overdue inspections, verification and resolution tracking.

Categories: potholes, road damage, garbage, drainage, streetlights, water leakage and other infrastructure damage.

Constraints: no IoT sensors, no CCTV, no external camera infrastructure and no automatic infrastructure monitoring. Photographs are uploaded by citizens or inspectors. Use clearly labelled simulated data. Never present hardcoded statistics as live database records.

Create a professional, mobile-first Indian civic technology interface. Use modular reusable components and keep backend APIs separate from frontend components so a custom Python AI engine can be connected later.

Build the initial application structure, navigation, role dashboards and complaint registration workflow first.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ebdd1c06-01ab-45a2-a811-6f7fdc429db3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
