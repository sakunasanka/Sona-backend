import * as yup from 'yup';
import { ValidationError } from '../utils/errors';

export const createUserSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),

    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!#%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('Password is required'),
    
    name: yup
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .required('Name is required'),

    userType: yup
        .string()
        .oneOf(['Client', 'Counselor'], 'User type must be either Client or Counselor')
        .required('User type is required'),
    
    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional()
})

export const signInSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),

    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
})

export const emailSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),
})

export const updateProfileSchema = yup.object({
    name: yup
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name cannot exceed 50 characters')
        .optional(),

    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional()
})
/**
 * Validates data against a Yup schema.
 * @param schema - The Yup schema to validate against.
 * @param data - The data to validate.
 * @returns A promise that resolves with the validated data.
 * @throws ValidationError if validation fails.
 */

export const validateData = async <T>(schema: yup.ObjectSchema<any>, data: any): Promise<T> => {
    try {
        return await schema.validate(data, { abortEarly: false });
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            throw new ValidationError(error.errors.join(', '));
        }
        throw error; // Re-throw unexpected errors
    }
}
