import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase";
import axios from "axios";
import { sendEmail } from "../utils/mailer";
import { CreateClientData, CreateCounselorData, CreateUserData, SignInData, UserService } from "../services/UserSerives";
import { ValidationError, ItemNotFoundError, ConflictError, AuthenticationError } from "../utils/errors";
import { ApiResponseUtil } from "../utils/apiResponse";
import { validateData, signInSchema } from "../schema/ValidationSchema";
import * as path from "path";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY!;

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  console.log("Signup request received:", req.body);
  const { email, password, displayName, userType, additionalData } = req.body;

  if (!email || !password || !displayName || !userType) {
    throw new ValidationError("Email, password, displayName, and userType are required");
  }

  if (userType === "Client") {
    console.log("Creating client with data:", { email, displayName, userType });
    const clientData: CreateClientData = {
      email: email,
      password: password,
      name: displayName,
      userType: 'Client' as const,
      //client only data
      isStudent: additionalData.isStudent || false,
      nickName: additionalData.nickName || "",
      avatar: additionalData.avatar || "",
    };

    console.log("About to call UserService.createUser with:", clientData);
    const result = await UserService.createUser(clientData);

    if (result) {
      ApiResponseUtil.created(res, {
        user: result.dbUser,
        firebaseUser: {
          uid: result.firebaseUser.uid,
          email: result.firebaseUser.email,
          displayName: result.firebaseUser.displayName,
        }
      }, "Client created successfully");
    }
  } else if (userType === "Counselor") {
    console.log("Creating counselor with data:", { email, displayName, userType });
    const counselorData: CreateCounselorData = {
      email: email,
      password: password,
      name: displayName,
      userType: 'Counselor' as const,
      //counselor only data
      title: additionalData.title,
      specialities: additionalData.specialities || [],
      address: additionalData.address,
      contact_no: additionalData.contact_no,
      license_no: additionalData.license_no,
      idCard: additionalData.idCard,
      isVolunteer: additionalData.isVolunteer || false,
      isAvailable: additionalData.isAvailable || true,
      description: additionalData.description,
      rating: additionalData.rating || 0,
      sessionFee: additionalData.sessionFee || 0
    };

    if (process.env.DEBUG === 'true') {
      console.log("About to call UserService.createUser for counselor with:", counselorData);
    }
    const result = await UserService.createUser(counselorData);
    
    if (result) {
      ApiResponseUtil.created(res, {
        user: result.dbUser,
        firebaseUser: {
          uid: result.firebaseUser.uid,
          email: result.firebaseUser.email,
          displayName: result.firebaseUser.displayName,
        }
      }, "Counselor created successfully");
    }
  } else {
    throw new ValidationError("Invalid userType. Must be 'Client' or 'Counselor'");
  }
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  console.log("Signin request received:", req.body);

  const signInData: SignInData = {
    email: email,
    password: password
  }

  const validatedData = await validateData<SignInData>(signInSchema, signInData);

  const result = await UserService.signInUser(validatedData);

  // try {
  //   const response = await axios.post(
  //     `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  //     {
  //       email,
  //       password,
  //       returnSecureToken: true,
  //     }
  //   );

  //   const { idToken, refreshToken, localId } = response.data;

  //   const userRecord = await adminAuth.getUser(localId);
  //   const displayName = userRecord.displayName;

  //   ApiResponseUtil.success(res, {
  //     uid: localId,
  //     idToken,
  //     refreshToken,
  //     displayName,
  //   }, "Signed in successfully");
  // } catch (error: any) {
  //   console.error("Signin Error:", error?.response?.data || error.message);
    
  //   // Handle Firebase authentication errors
  //   if (error?.response?.data?.error?.message) {
  //     throw new AuthenticationError(error.response.data.error.message);
  //   } else {
  //     throw new AuthenticationError("Authentication failed");
  //   }
  // }

  if(result) {
    ApiResponseUtil.success(res, {
      uid: result.user.id,
      idToken: result.tokens.idToken,
      email: result.user.email,
      displayName: result.user.name,
    })
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError("Email is required");
  }

  const link = await adminAuth.generatePasswordResetLink(email);
  
  const emailContent = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td>
          <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">Reset Your Password</h2>
          
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
            Hello,
          </p>
          
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
            We received a request to reset your password for your Sona account. If you made this request, click the button below to create a new password:
          </p>
          
          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding: 30px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius: 6px; background-color: #667eea;">
                      <a href="${link}" style="display: inline-block; padding: 16px 32px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset My Password</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
            This password reset link will expire in 1 hour for security reasons.
          </p>
          
          <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          
          <!-- Fallback link box -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="background-color: #f7fafc; padding: 16px; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif;">
                  Having trouble with the button?
                </p>
                <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; font-family: Arial, sans-serif;">
                  Copy and paste this link into your browser:
                </p>
                <a href="${link}" style="color: #667eea; font-size: 14px; word-break: break-all; font-family: Arial, sans-serif;">${link}</a>
              </td>
            </tr>
          </table>
          
          <p style="margin: 30px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
            Best regards,<br>
            <strong>The Sona Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  // Use a publicly accessible URL for the logo or provide the correct local path
  // Option 1: Use a public URL (recommended for production)
  const logoUrl = process.env.LOGO_URL;
  
  // Option 2: Use local path (will be converted to base64 by the mailer)
  // const logoUrl = path.resolve(__dirname, '../assets/icon.png');
  
  // Option 3: Remove logo if no public URL is available
  // const logoUrl = undefined;

  await sendEmail(
    email,
    "Reset Your Password - Sona",
    emailContent,
    logoUrl
  );

  ApiResponseUtil.success(res, null, "Password reset link sent to email");
  try {
    const link = await adminAuth.generatePasswordResetLink(email);
    
    const emailContent = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td>
            <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">Reset Your Password</h2>
            
            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
              Hello,
            </p>
            
            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
              We received a request to reset your password for your Sona account. If you made this request, click the button below to create a new password:
            </p>
            
            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding: 30px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-radius: 6px; background-color: #667eea;">
                        <a href="${link}" style="display: inline-block; padding: 16px 32px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset My Password</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
              This password reset link will expire in 1 hour for security reasons.
            </p>
            
            <p style="margin: 0 0 24px 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <!-- Fallback link box -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="background-color: #f7fafc; padding: 16px; border-left: 4px solid #667eea; border-radius: 4px;">
                  <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif;">
                    Having trouble with the button?
                  </p>
                  <p style="margin: 0 0 8px 0; color: #718096; font-size: 14px; font-family: Arial, sans-serif;">
                    Copy and paste this link into your browser:
                  </p>
                  <a href="${link}" style="color: #667eea; font-size: 14px; word-break: break-all; font-family: Arial, sans-serif;">${link}</a>
                </td>
              </tr>
            </table>
            
            <p style="margin: 30px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
              Best regards,<br>
              <strong>The Sona Team</strong>
            </p>
          </td>
        </tr>
      </table>
    `;

    // Use a publicly accessible URL for the logo or provide the correct local path
    // Option 1: Use a public URL (recommended for production)
    const logoUrl = process.env.LOGO_URL;
    
    // Option 2: Use local path (will be converted to base64 by the mailer)
    // const logoUrl = path.resolve(__dirname, '../assets/icon.png');
    
    // Option 3: Remove logo if no public URL is available
    // const logoUrl = undefined;

    await sendEmail(
      email,
      "Reset Your Password - Sona",
      emailContent,
      logoUrl
    );

    res.status(200).json({
      message: "Password reset link sent to email",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    res.status(400).json({ error: error.message });
  }
};