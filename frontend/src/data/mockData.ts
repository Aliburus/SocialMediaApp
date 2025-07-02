import { User, Post, Notification, Story } from "../types";

export const mockUsers: User[] = [
  {
    id: "1",
    username: "john_doe",
    fullName: "John Doe",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "Photographer & Travel Enthusiast 📸✈️",
    followersCount: 1250,
    followingCount: 890,
    postsCount: 156,
    isVerified: true,
    isFollowing: true,
    isFollower: true,
  },
  {
    id: "2",
    username: "jane_smith",
    fullName: "Jane Smith",
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "Artist & Designer 🎨",
    followersCount: 2340,
    followingCount: 567,
    postsCount: 89,
    isVerified: false,
    isFollowing: false,
    isFollower: true,
  },
  {
    id: "3",
    username: "travel_mike",
    fullName: "Mike Johnson",
    avatar:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    bio: "World Traveler 🌍",
    followersCount: 5670,
    followingCount: 1200,
    postsCount: 234,
    isVerified: true,
    isFollowing: true,
    isFollower: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: "1",
    user: mockUsers[0],
    image:
      "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=400",
    caption: "Beautiful sunset at the beach 🌅 #sunset #beach #photography",
    likes: 234,
    comments: 12,
    timestamp: "2 hours ago",
    isLiked: false,
    location: "Malibu Beach",
  },
  {
    id: "2",
    user: mockUsers[1],
    image:
      "https://images.pexels.com/photos/1109543/pexels-photo-1109543.jpeg?auto=compress&cs=tinysrgb&w=400",
    caption: "New artwork finished! What do you think? 🎨",
    likes: 156,
    comments: 8,
    timestamp: "4 hours ago",
    isLiked: true,
  },
  {
    id: "3",
    user: mockUsers[2],
    image:
      "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400",
    caption:
      "Amazing view from the mountains! 🏔️ #travel #mountains #adventure",
    likes: 445,
    comments: 23,
    timestamp: "6 hours ago",
    isLiked: false,
    location: "Swiss Alps",
  },
];

export const mockStories: Story[] = [
  {
    id: "1",
    user: mockUsers[0],
    image:
      "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=150",
    timestamp: "2 hours ago",
    isViewed: false,
  },
  {
    id: "2",
    user: mockUsers[1],
    image:
      "https://images.pexels.com/photos/1109543/pexels-photo-1109543.jpeg?auto=compress&cs=tinysrgb&w=150",
    timestamp: "4 hours ago",
    isViewed: true,
  },
  {
    id: "3",
    user: mockUsers[2],
    image:
      "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=150",
    timestamp: "6 hours ago",
    isViewed: false,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "like",
    user: mockUsers[1],
    post: mockPosts[0],
    text: "liked your photo",
    timestamp: "2 minutes ago",
    isRead: false,
  },
  {
    id: "2",
    type: "follow",
    user: mockUsers[2],
    text: "started following you",
    timestamp: "1 hour ago",
    isRead: false,
  },
  {
    id: "3",
    type: "comment",
    user: mockUsers[0],
    post: mockPosts[1],
    text: "commented on your photo",
    timestamp: "3 hours ago",
    isRead: true,
  },
  {
    id: "4",
    type: "follow",
    user: mockUsers[1],
    text: "seni takip etmek istiyor",
    timestamp: "5 dakika önce",
    isRead: false,
    status: "pending",
  },
];
