# SocialApp

## Project Description

SocialApp is a full-featured mobile social media application that enables users to connect, share media, and communicate in real time. The app provides a seamless experience for discovering new content, interacting with other users, and managing personal profiles securely.

## Core Features

- User registration and secure authentication
- Profile management (avatar, bio, privacy settings)
- Media sharing (photos, stories, reels)
- Real-time messaging and chat
- Follow/unfollow system with private account support
- Notifications for interactions and requests
- User and content search
- Save and archive posts
- Light/Dark theme support

## Tech Stack / Technologies Used

### Frontend

- React Native (TypeScript)
- React Navigation
- Context API (state management)
- Axios (API requests)
- Expo (optional)

### Backend

- Node.js (Express)
- MongoDB (Mongoose)
- Socket.io (real-time features)
- JWT (authentication)
- CORS, dotenv, bcryptjs, and other middleware

### Additional Libraries & Tools

- AsyncStorage
- react-native-safe-area-context
- react-native-vector-icons
- Other supporting libraries

## Installation Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/Aliburus/SocialApp.git
cd SocialApp
```

### 2. Backend Setup

```sh
cd backend
npm install
cp .env.example .env
# Edit the .env file with your MongoDB connection string and FRONTEND_URL
npm start
```

### 3. Frontend Setup

```sh
cd ../frontend
npm install
cp .env.example .env
# Edit the .env file with your API_URL
npm start
# or if using Expo:
# npx expo start
```

### 4. Environment Variables

Check the `.env.example` file in both directories and create your own `.env` files accordingly.

## Usage

- Start both backend and frontend servers
- Register or log in
- Edit your profile
- Share photos, stories, or reels
- Search and follow other users
- Use messaging and notification features
- Switch between light and dark themes

## API Documentation

### Example Routes

#### User Registration

```
POST /api/users/register
Body: { username, email, password, ... }
Response: { _id, username, email, ... }
```

#### Login

```
POST /api/users/login
Body: { emailOrUsername, password }
Response: { token, _id, username, ... }
```

#### Get User Profile

```
GET /api/users/profile/:id?currentUserId=xxx
Response: { _id, username, avatar, isFollowing, isFollowedBy, ... }
```

#### Follow User

```
POST /api/users/follow
Body: { userId, targetUserId }
Response: { success: true }
```

For more API routes, see the backend/routes directory.

## Screenshots / Demo

> You can add screenshots or demo videos here.

## Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow the code style and project structure when submitting PRs.

## License

This project is licensed under the MIT License.

## Contact / Support

- GitHub: [Aliburus](https://github.com/Aliburus)
- LinkedIn: [Ali Burus](https://linkedin.com/in/aliburus)
