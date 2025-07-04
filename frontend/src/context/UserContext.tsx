import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  _id?: string;
  id?: string;
  username: string;
  name?: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  isPlusUser?: boolean;
  isPrivate?: boolean;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  pendingFollowRequests?: string[];
  sentFollowRequests?: string[];
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      console.log("UserContext: Updating user with:", updates);
      console.log("UserContext: New avatar URL:", updatedUser.avatar);
      setUser(updatedUser);
      AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        console.log("UserContext: Refreshing user from storage:", userObj);
        setUser(userObj);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
