export interface UserEventPayload {
  userID: string;
  username: string;
  profilePicture: string | null;
}

export function toUserEventPayload(profile: {
  userID: string;
  username: string;
  profilePicture: string | null;
}): UserEventPayload {
  return {
    userID: profile.userID,
    username: profile.username,
    profilePicture: profile.profilePicture,
  };
}
