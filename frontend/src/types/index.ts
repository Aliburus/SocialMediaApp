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
  isFollower?: boolean;
}

export interface Post {
  id: string;
  _id?: string;
  user: User;
  image: string;
  caption: string;
  description?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  location?: string;
  savedBy?: string[];
  createdAt?: string;
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
  type: "like" | "comment" | "follow" | "mention";
  user: User;
  post?: Post;
  text: string;
  timestamp: string;
  isRead: boolean;
  status?: "pending" | "accepted" | "rejected";
}

export interface Story {
  id: string;
  user: User;
  image: string;
  timestamp: string;
  isViewed: boolean;
}
