import api from "./api";

export const followUser = async (userId: string, targetUserId: string) => {
  const res = await api.post("/users/follow", { userId, targetUserId });
  return res.data;
};

export const unfollowUser = async (userId: string, targetUserId: string) => {
  const res = await api.post("/users/unfollow", { userId, targetUserId });
  return res.data;
};

export const sendFollowRequest = async (
  userId: string,
  targetUserId: string
) => {
  const res = await api.post("/users/send-follow-request", {
    userId,
    targetUserId,
  });
  return res.data;
};

export const cancelFollowRequest = async (
  userId: string,
  targetUserId: string
) => {
  const res = await api.post("/users/cancel-follow-request", {
    userId,
    targetUserId,
  });
  return res.data;
};

export const acceptFollowRequest = async (
  userId: string,
  requesterId: string
) => {
  const res = await api.post("/users/accept-follow-request", {
    userId,
    requesterId,
  });
  return res.data;
};

export const rejectFollowRequest = async (
  userId: string,
  requesterId: string
) => {
  const res = await api.post("/users/reject-follow-request", {
    userId,
    requesterId,
  });
  return res.data;
};

// Takip durumunu merkezi kontrol et
export const getFollowStatus = async (userId: string, targetUserId: string) => {
  const res = await api.get(
    `/users/profile/${targetUserId}?currentUserId=${userId}`
  );
  // response: { isFollowing, isFollowedBy, isRequestedByMe, isRequestedByOther, isPrivate }
  return {
    isFollowing: res.data.isFollowing,
    isFollowedBy: res.data.isFollowedBy,
    isRequestedByMe: res.data.isRequestedByMe,
    isRequestedByOther: res.data.isRequestedByOther,
    isPrivate: res.data.isPrivate,
    username: res.data.username,
  };
};
