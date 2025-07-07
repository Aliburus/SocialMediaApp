# InstagramClone

A full-stack mobile application inspired by Instagram. This app allows users to share photos, follow others, send messages, and interact in a social environment.

## Features

- User registration & authentication
- Profile management
- Post creation, feed, and explore
- Like, comment, and save posts
- Stories (view, add, archive)
- Follow/unfollow users
- Private/public account support
- Direct messaging (DM)
- Notifications
- Search users
- Dark & light theme support

## Tech Stack

- **Frontend:** React Native (TypeScript)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Other:** AsyncStorage, Expo, JWT, bcrypt, socket.io

## Screenshots / Demo

<!-- Add screenshots or GIFs here -->

## Installation Guide

### Prerequisites

- Node.js >= 14.x
- npm or yarn
- MongoDB instance (local or cloud)
- Expo CLI (for React Native)

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Environment Variables

### Backend (.env example)

```
MONGODB_URI=mongodb://localhost:27017/instagramclone
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Frontend (.env example)

```
BACKEND_URL=http://localhost:5000/api
```

## Folder Structure

```
InstagramClone/
  backend/
    config/
    controllers/
    models/
    routes/
    utils/
    server.js
    package.json
  frontend/
    src/
      components/
      context/
      screens/
      services/
      types/
      utils/
    App.tsx
    package.json
```

## API Endpoints (Major)

### Auth & User

- `POST   /api/users/register` – Register
- `POST   /api/users/login` – Login
- `POST   /api/users/update-profile` – Update profile
- `GET    /api/users/profile/:userId` – Get profile
- `PUT    /api/users/:userId/toggle-private` – Toggle private account

### Posts

- `GET    /api/posts?userId=...` – Get feed posts
- `GET    /api/posts/user/:userId` – Get user posts
- `POST   /api/posts` – Create post
- `DELETE /api/posts/:postId` – Delete post

### Follow

- `POST   /api/users/follow` – Follow user
- `POST   /api/users/unfollow` – Unfollow user
- `POST   /api/users/send-follow-request` – Send follow request
- `POST   /api/users/accept-follow-request` – Accept follow request
- `POST   /api/users/reject-follow-request` – Reject follow request

### Stories

- `GET    /api/users/stories` – Get stories
- `POST   /api/users/stories` – Add story
- `DELETE /api/users/stories/:id` – Delete story

### Messaging

- `GET    /api/users/:userId/conversations` – Get DM list
- `POST   /api/users/send-message` – Send message

### Notifications

- `GET    /api/notifications/:userId` – Get notifications

## How to Run Locally

1. **Start MongoDB** (local or Atlas)
2. **Backend:**
   ```bash
   cd backend
   npm run dev
   # or: node server.js
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npx expo start
   ```
4. **Configure .env files** as shown above.
5. **Open app** on emulator or real device (Expo Go recommended).

## Contributing

- Fork the repo
- Create a feature branch (`git checkout -b feature/your-feature`)
- Commit your changes
- Open a Pull Request
- Please follow code style and add clear commit messages

## License

MIT
