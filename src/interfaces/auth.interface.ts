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