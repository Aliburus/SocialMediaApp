# Social Media Mobile App

## Overview

This project is a full-stack social media mobile application that enables users to share short videos, interact with content, and discover personalized recommendations. The app features:

- User registration and authentication
- Video (reel) sharing and feed
- Personalized content recommendations based on user behavior
- Like, comment, save, and follow functionalities
- Real-time notifications and messaging
- User profiles and story sharing
  -Explore Screen
- Secure, scalable backend and modern mobile UI

## Tech Stack

- **Frontend:** React Native (TypeScript), Expo
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Other:** Socket.io (real-time), AsyncStorage, JWT Auth

## Installation Instructions

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)
- Expo CLI (for mobile development)

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create a `.env` file in `backend/` with the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Frontend Setup

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create an `.env` file or use `app.json` to set the backend URL:
   ```env
   BACKEND_URL=http://localhost:5000
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Environment Variables

- **Backend:**
  - `MONGO_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT authentication
  - `PORT`: (optional) Port for backend server (default: 5000)
- **Frontend:**
  - `BACKEND_URL`: Base URL for backend API (e.g., http://localhost:5000)

## Running the App (Development Mode)

- Start the backend server (see above)
- Start the frontend with Expo (`npx expo start`)
- Use a physical device with Expo Go or an emulator/simulator to run the app

## API Overview

The backend exposes a RESTful API for all core features, including:

- User authentication and profile management
- Video (reel) CRUD operations
- Feed and recommendation endpoints
- Comments, likes, saves, follows
- Notifications and messaging
- Story and explore endpoints

> For detailed API documentation, see the `/backend/routes/` and controller files, or generate docs with tools like Swagger if needed.

## Folder Structure

```
project-root/
  backend/
    controllers/
    models/
    routes/
    middleware/
    config/
    server.js
  frontend/
    src/
      components/
      screens/
      context/
      services/
      types/
      utils/
    App.tsx
```

## Contribution Guidelines

1. Fork the repository and create a feature branch.
2. Write clear, well-documented code and meaningful commit messages.
3. Ensure all new code is covered by tests where applicable.
4. Open a pull request describing your changes.
5. Follow the code of conduct and respect review feedback.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
