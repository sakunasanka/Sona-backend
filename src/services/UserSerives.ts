import { adminAuth } from "../config/firebase";
import User from "../models/User";
import axios from "axios";
import { ItemNotFoundError, ValidationError, AuthenticationError, ConflictError, ExternalServiceError } from "../utils/errors";
import { createUserSchema, validateData, signInSchema, emailSchema, updateProfileSchema } from '../schema/ValidationSchema';
import Client from "../models/Client";
import Counselor from "../models/Counselor";

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    userType: 'Client' | 'Counselor' | 'Admin';
    avatar?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateClientData extends CreateUserData {
    userType: 'Client';
    nickName?: string;
    isStudent: boolean;
}

export interface CreateCounselorData extends CreateUserData {
    userType: 'Counselor';
    title: string;
    specialities: string[];
    address: string;
    contact_no: string;
    license_no: string;
    idCard: string;
    isVolunteer?: boolean;
    isAvailable?: boolean;
    description?: string;
    rating?: number;
    sessionFee?: number;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface UserResponse {
    id: number;
    firebaseId: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'Client' | 'Counselor' | 'Admin' | 'Psychiatrist';
    createdAt: Date;
    updatedAt: Date;
}

export interface ClientResponse extends UserResponse {
    role: 'Client';
    isStudent?: boolean;
    nickName?: string;
}

export interface CounselorResponse extends UserResponse {
    title: string;
    specialities: string[];
    address: string;
    contact_no: string;
    license_no: string;
    idCard: string;
    isVolunteer?: boolean;
    isAvailable?: boolean;
    description?: string;
    rating?: number;
    sessionFee?: number;
}

export class UserService {
    static async createUser(userData: CreateUserData | CreateClientData | CreateCounselorData) {
        // Validate input data`
        const validatedData = await validateData<CreateUserData>(createUserSchema, userData);
        let firebaseUser: any = null;
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ where: { email: validatedData.email } });
            if (existingUser) {
                throw new ConflictError('User with this email already exists');
            }

            // Create user in Firebase
            firebaseUser = await adminAuth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.name
            });

            let dbUser;

            // Create user in database
            if(validatedData.userType === 'Client'){
                const clientData = userData as CreateClientData;
                dbUser = await Client.createClient({
                    firebaseId: firebaseUser.uid,
                    name: clientData.name,
                    email: validatedData.email,
                    avatar: validatedData.avatar,
                    isStudent: clientData.isStudent,
                    nickName: clientData.nickName
                });
            }

            else if(validatedData.userType === 'Counselor') {
                const counselorData = userData as CreateCounselorData;

                console.log('Creating counselor with data:', counselorData);
                dbUser = await Counselor.createCounselor({
                    firebaseId: firebaseUser.uid,
                    name: counselorData.name,
                    email: counselorData.email,
                    avatar: counselorData.avatar,
                    title: counselorData.title,
                    specialities: counselorData.specialities,
                    address: counselorData.address,
                    contact_no: counselorData.contact_no,
                    license_no: counselorData.license_no,
                    idCard: counselorData.idCard,
                    isVolunteer: counselorData.isVolunteer,
                    isAvailable: counselorData.isAvailable,
                    description: counselorData.description, 
                    rating: counselorData.rating,
                    sessionFee: counselorData.sessionFee
                })
            } else if(validatedData.userType === 'Admin') {
                dbUser = await User.create({
                    firebaseId: firebaseUser.uid,
                    name: validatedData.name,
                    email: validatedData.email,
                    avatar: validatedData.avatar,
                    role: 'Admin'
                });
            }

            // Return the created user
            if (!dbUser) {
                throw new ExternalServiceError('Failed to create user in the database');
            }

            if (dbUser) {
                return {
                    firebaseUser,
                    dbUser: dbUser.toJSON() as UserResponse
                };
            }

        } catch (error) {
            // Cleanup Firebase user if database creation fails
            if (firebaseUser && error instanceof Error && error.message.includes('Database')) {
                try {
                    await adminAuth.deleteUser(firebaseUser.uid);
                } catch (cleanupError) {
                    console.error('Failed to cleanup Firebase user:', cleanupError);
                }
            }
            throw error;
        }
    }

    static async signInUser(signInData: SignInData) {
        // Validate input data
        const validatedData = await validateData<SignInData>(signInSchema, signInData);

        try {
            const dbUser = await User.findOne({
                where: { email: validatedData.email },
            });

            if (!dbUser) {
                throw new ItemNotFoundError('User not found in the database');
            }

            const response = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
                {
                    email: signInData.email,
                    password: signInData.password,
                    returnSecureToken: true,
                }
            );

            const { idToken, refreshToken, localId } = response.data;

            return {
                tokens: { idToken, refreshToken, firebaseId: localId },
                user: dbUser.toJSON() as UserResponse
            };
        } catch (error) {
            if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
                throw error;
            }
            
            // Handle Firebase auth errors
            const err = error as any;
            if (err.response?.data?.error?.message) {
                throw new AuthenticationError(err.response.data.error.message);
            }
            
            console.error('Error signing in user:', error);
            throw new ExternalServiceError('Authentication service error');
        }
    }

    // User management methods
    static async getUserByFirebaseId(firebaseId: string): Promise<UserResponse> {
        if (!firebaseId || typeof firebaseId !== 'string') {
            throw new ValidationError('Firebase ID is required and must be a string');
        }

        const user = await User.findOne({ where: { firebaseId: firebaseId } });
        
        if (!user) {
            throw new ItemNotFoundError('User not found with the provided Firebase ID');
        }
        
        return user.toJSON() as UserResponse;
    }

    static async getUserById(userId: number): Promise<UserResponse> {
        if (!userId || typeof userId !== 'number' || userId <= 0) {
            throw new ValidationError('User ID is required and must be a positive number');
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            throw new ItemNotFoundError('User not found with the provided ID');
        }
        
        return user.toJSON() as UserResponse;
    }

    static async getUserByEmail(email: string): Promise<UserResponse> {
        // Validate email format
        const validatedEmail = await validateData<{ email: string }>(emailSchema, { email });

        const user = await User.findOne({ where: { email: validatedEmail.email } });

        if (!user) {
            throw new ItemNotFoundError('User not found with the provided email');
        }
        
        return user.toJSON() as UserResponse;
    }

    static async updateUserProfile(userId: number, data: { name?: string; avatar?: string }): Promise<UserResponse> {
        if (!userId || typeof userId !== 'number' || userId <= 0) {
            throw new ValidationError('User ID is required and must be a positive number');
        }

        if (!data || typeof data !== 'object') {
            throw new ValidationError('Update data is required and must be an object');
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            throw new ItemNotFoundError('User not found with the provided ID');
        }

        // Validate name and avatar fields
        const validatedData = await validateData<{ name?: string; avatar?: string}>(updateProfileSchema, data);

        // Update fields
        if (validatedData.name) user.name = validatedData.name;
        if (validatedData.avatar !== undefined) user.avatar = validatedData.avatar;

        await user.save();
        return user.toJSON() as UserResponse;
    }

    static async deleteUser(firebaseId: string): Promise<{ message: string }> {
        if (!firebaseId || typeof firebaseId !== 'string') {
            throw new ValidationError('Firebase ID is required and must be a string');
        }

        try {
            // Delete the user from Firebase
            await adminAuth.deleteUser(firebaseId);

            // Delete the user from the database
            const user = await User.findOne({ where: { firebaseId } });
            if (!user) {
                throw new ItemNotFoundError('User not found with the provided Firebase ID');
            }
            
            await user.destroy();

            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error instanceof ItemNotFoundError || error instanceof ValidationError) {
                throw error;
            }
            throw new ExternalServiceError('Failed to delete user');
        }
    }

    static async getUserDetails(userId: number): Promise<UserResponse | null> {
        if (!userId || typeof userId !== 'number' || userId <= 0) {
            throw new ValidationError('User ID is required and must be a positive number');
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'firebaseId', 'name', 'email', 'avatar', 'role'],
        });

        if (!user) {
            throw new ItemNotFoundError('User not found with the provided ID');
        }

        return user.toJSON() as UserResponse;
    }
}