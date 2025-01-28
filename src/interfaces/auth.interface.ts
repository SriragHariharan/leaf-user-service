//format of auth data
export interface Auth {
    email?: string,
    username?: string,
    password?: string|null,
    confirmPassword?: string,
    id?: string,
    provider?: string|null,
    profilePicture?: string|null
}

export interface User { 
    id?: number; 
    userID?: string; 
    username?: string; 
    description?: string | null; 
    profilePicture?: string | null; 
    coverPicture?: string | null; 
    location?: string | null; 
    createdAt?: Date; 
}