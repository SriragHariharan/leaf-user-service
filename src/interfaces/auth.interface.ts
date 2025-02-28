//format of auth data
export interface Auth {
    email?: string,
    username?: string,
    password?: string|null,
    confirmPassword?: string,
    id?: string,
    provider?: string|null,
    profilePicture?: string|null
    type?: string|null
    userID?: string|null
}

export interface User { 
    id?: string; 
    userID?: string; 
    username?: string; 
    description?: string | null; 
    profilePicture?: string | null; 
    coverPicture?: string | null; 
    location?: string | null; 
    createdAt?: Date; 
}