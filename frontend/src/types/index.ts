export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  user: User;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  location?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: User;
  post?: Post;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Story {
  id: string;
  user: User;
  image: string;
  timestamp: string;
  isViewed: boolean;
}