import { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase";
import axios from "axios";
import { sendEmail } from "../utils/mailer";
import { CreateClientData, CreateCounselorData, CreatePsychiatristData, CreateUserData, SignInData, UserService } from "../services/UserSerives";
import { ValidationError, ItemNotFoundError, ConflictError, AuthenticationError } from "../utils/errors";
import { ApiResponseUtil } from "../utils/apiResponse";
import { validateData, signInSchema } from "../schema/ValidationSchema";
import { JwtServices } from "../services/JwtServices";
import * as path from "path";
import Client from "../models/Client";
import { QueryTypes } from "sequelize";
import { sequelize } from "../config/db";


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
      title: additionalData.title || "Counselor",
      specialities: additionalData.specialities || [],
      address: additionalData.address || "Not provided",
      contact_no: additionalData.contact_no || "Not provided",
      license_no: additionalData.license_no || "Not provided",
      idCard: additionalData.idCard || "Not provided",
      isVolunteer: additionalData.isVolunteer || false,
      isAvailable: additionalData.isAvailable !== undefined ? additionalData.isAvailable : true,
      description: additionalData.description || "",
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
  } else if (userType === "Admin") {
    console.log("Creating admin with data:", { email, displayName, userType });
    const adminData: CreateUserData = {
      email: email,
      password: password,
      name: displayName,
      userType: 'Admin' as const,
      avatar: additionalData.avatar || "",
    };

    const result = await UserService.createUser(adminData);

    if (result) {
      ApiResponseUtil.created(res, {
        user: result.dbUser,
        firebaseUser: {
          uid: result.firebaseUser.uid,
          email: result.firebaseUser.email,
          displayName: result.firebaseUser.displayName,
        }
      }, "Admin created successfully");
    }
  } else if (userType === "Psychiatrist") {
    console.log("Creating psychiatrist with data:", { email, displayName, userType });
    const psychiatristData: CreatePsychiatristData = {
      email: email,
      password: password,
      name: displayName,
      userType: 'Psychiatrist' as const,
      //psychiatrist only data
      title: additionalData.title || "Dr.",
      specialities: additionalData.specialities || [],
      address: additionalData.address || "Not provided",
      contact_no: additionalData.contact_no || "Not provided",
      license_no: additionalData.license_no || "Not provided",
      idCard: additionalData.idCard || "Not provided",
      isVolunteer: additionalData.isVolunteer || false,
      isAvailable: additionalData.isAvailable !== undefined ? additionalData.isAvailable : true,
      description: additionalData.description || "",
      rating: additionalData.rating || 0,
      sessionFee: additionalData.sessionFee || 0,
      status: additionalData.status || 'pending',
      coverImage: additionalData.coverImage || null,
      instagram: additionalData.instagram || null,
      linkedin: additionalData.linkedin || null,
      x: additionalData.x || null,
      website: additionalData.website || null,
      languages: additionalData.languages || []
    };

    if (process.env.DEBUG === 'true') {
      console.log("About to call UserService.createUser for psychiatrist with:", psychiatristData);
    }
    const result = await UserService.createUser(psychiatristData);
    
    if (result) {
      ApiResponseUtil.created(res, {
        user: result.dbUser,
        firebaseUser: {
          uid: result.firebaseUser.uid,
          email: result.firebaseUser.email,
          displayName: result.firebaseUser.displayName,
        }
      }, "Psychiatrist created successfully");
    }
  } else {
    throw new ValidationError("Invalid userType. Must be 'Client', 'Counselor', 'Admin', or 'Psychiatrist'");
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
    const jwtResult = await JwtServices.issueToken(result.tokens.idToken);

    // Insert login record into user_logins table
    try {
      await sequelize.query(`
        INSERT INTO user_logins (user_id)
        VALUES (?)
      `, {
        replacements: [result.user.id],
        type: QueryTypes.INSERT
      });
      console.log(`Login tracked for user ${result.user.id}`);
    } catch (loginError) {
      console.error('Failed to track login:', loginError);
      // Don't fail the login if tracking fails
    }

    ApiResponseUtil.success(res, {
      token: jwtResult.token,
      tokenType: 'Bearer',
      expiresIn: jwtResult.expiresIn,
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

export const checkIsStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the client ID from the authenticated user
    if (!req.user || !req.user.dbUser || !req.user.dbUser.id) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.dbUser.id;

    // Find the client by user ID
    const client = await Client.findClientById(userId);

    if (!client) {
      throw new ItemNotFoundError("Client not found");
    }

    // Return the isStudent status
    ApiResponseUtil.success(res, {
      isStudent: client.isStudent
    }, "Student status retrieved successfully");
    
  } catch (error) {
    next(error);
  }
};

export const checkClientIsStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      throw new ValidationError("Valid client ID is required");
    }
    
    // Check if the requester is an admin or authorized user
    if (!req.user || !req.user.dbUser || req.user.dbUser.userType !== 'Admin') {
      throw new ValidationError("Admin authorization required");
    }

    // Find the client by ID
    const client = await Client.findClientById(clientId);

    if (!client) {
      throw new ItemNotFoundError("Client not found");
    }

    // Return the isStudent status
    ApiResponseUtil.success(res, {
      clientId: client.id,
      isStudent: client.isStudent
    }, "Student status retrieved successfully");
    
  } catch (error) {
    next(error);
  }
};

export const updateClientStudentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the client ID from the authenticated user
    if (!req.user || !req.user.dbUser || !req.user.dbUser.id) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.dbUser.id;
    const { isStudent } = req.body;

    if (typeof isStudent !== 'boolean') {
      throw new ValidationError("isStudent field must be a boolean value");
    }

    // Find the client by user ID
    const client = await Client.findClientById(userId);

    if (!client) {
      throw new ItemNotFoundError("Client not found");
    }

    // Update the isStudent status in the database
    await sequelize.query(`
      UPDATE clients 
      SET "isStudent" = ?, "updatedAt" = NOW()
      WHERE "userId" = ?
    `, {
      replacements: [isStudent, userId],
      type: QueryTypes.UPDATE
    });

    // Return the updated status
    ApiResponseUtil.success(res, {
      isStudent
    }, "Student status updated successfully");
    
  } catch (error) {
    next(error);
  }
};

export const updateClientStudentStatusById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const { isStudent } = req.body;
    
    if (isNaN(clientId)) {
      throw new ValidationError("Valid client ID is required");
    }
    
    if (typeof isStudent !== 'boolean') {
      throw new ValidationError("isStudent field must be a boolean value");
    }
    
    // Check if the requester is an admin or authorized user
    if (!req.user || !req.user.dbUser || req.user.dbUser.userType !== 'Admin') {
      throw new ValidationError("Admin authorization required");
    }

    // Find the client by ID
    const client = await Client.findClientById(clientId);

    if (!client) {
      throw new ItemNotFoundError("Client not found");
    }

    // Update the isStudent status in the database
    await sequelize.query(`
      UPDATE clients 
      SET "isStudent" = ?, "updatedAt" = NOW()
      WHERE "userId" = ?
    `, {
      replacements: [isStudent, clientId],
      type: QueryTypes.UPDATE
    });

    // Return the updated status
    ApiResponseUtil.success(res, {
      clientId,
      isStudent
    }, "Student status updated successfully");
    
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the user ID from the authenticated user
    if (!req.user || !req.user.dbUser || !req.user.dbUser.id) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.dbUser.id;

    // Query to get client profile data with new fields
    const [profileData] = await sequelize.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar,
        u."createdAt" as memberSince,
        c."nickName",
        c."isStudent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.id = ? AND u.role = 'Client'
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    if (!profileData) {
      throw new ItemNotFoundError("Client profile not found");
    }

    // Format the response
    const profile = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      avatar: profileData.avatar,
      nickName: profileData.nickName,
      isStudent: profileData.isStudent,
      memberSince: profileData.memberSince
    };

    ApiResponseUtil.success(res, profile, "Profile retrieved successfully");

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the user ID from the authenticated user
    if (!req.user || !req.user.dbUser || !req.user.dbUser.id) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.dbUser.id;
    const { name, avatar, nickName, isStudent } = req.body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      throw new ValidationError("Name must be a non-empty string");
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      throw new ValidationError("Avatar must be a string");
    }

    if (nickName !== undefined && typeof nickName !== 'string') {
      throw new ValidationError("NickName must be a string");
    }

    if (isStudent !== undefined && typeof isStudent !== 'boolean') {
      throw new ValidationError("isStudent must be a boolean");
    }

    const transaction = await sequelize.transaction();

    try {
      // Update user table fields
      const userUpdates: any = {};
      if (name !== undefined) userUpdates.name = name.trim();
      if (avatar !== undefined) userUpdates.avatar = avatar;

      if (Object.keys(userUpdates).length > 0) {
        await sequelize.query(`
          UPDATE users
          SET ${Object.keys(userUpdates).map(key => `"${key}" = ?`).join(', ')}, "updatedAt" = NOW()
          WHERE id = ? AND role = 'Client'
        `, {
          replacements: [...Object.values(userUpdates), userId],
          transaction
        });
      }

      // Update client table fields
      const clientUpdates: any = {};
      if (nickName !== undefined) clientUpdates.nickName = nickName;
      if (isStudent !== undefined) clientUpdates.isStudent = isStudent;

      if (Object.keys(clientUpdates).length > 0) {
        await sequelize.query(`
          UPDATE clients
          SET ${Object.keys(clientUpdates).map(key => `"${key}" = ?`).join(', ')}, "updatedAt" = NOW()
          WHERE "userId" = ?
        `, {
          replacements: [...Object.values(clientUpdates), userId],
          transaction
        });
      }

      await transaction.commit();

      // Return updated profile
      const [updatedProfile] = await sequelize.query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.avatar,
          u."createdAt" as memberSince,
          c."nickName",
          c."isStudent"
        FROM users u
        JOIN clients c ON u.id = c."userId"
        WHERE u.id = ? AND u.role = 'Client'
      `, {
        replacements: [userId],
        type: QueryTypes.SELECT
      }) as any[];

      if (!updatedProfile) {
        throw new ItemNotFoundError("Client profile not found");
      }

      const profile = {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        avatar: updatedProfile.avatar,
        nickName: updatedProfile.nickName,
        isStudent: updatedProfile.isStudent,
        memberSince: updatedProfile.memberSince
      };

      ApiResponseUtil.success(res, profile, "Profile updated successfully");

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    next(error);
  }
};

export const getUserLoginStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the user ID from the authenticated user
    if (!req.user || !req.user.dbUser || !req.user.dbUser.id) {
      throw new ValidationError("Authentication required");
    }

    const userId = req.user.dbUser.id;

    // Get total login count
    const [loginCountResult] = await sequelize.query(`
      SELECT COUNT(*) as total_logins
      FROM user_logins
      WHERE user_id = ?
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    const totalLogins = parseInt(loginCountResult.total_logins) || 0;

    // Get distinct login dates for streak calculation
    const loginDates = await sequelize.query(`
      SELECT DISTINCT DATE(login_at + INTERVAL '5.5 hours') as login_date
      FROM user_logins
      WHERE user_id = ?
      ORDER BY DATE(login_at + INTERVAL '5.5 hours') DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    }) as any[];

    // Calculate current day streak
    let currentStreak = 0;
    if (loginDates.length > 0) {
      // Get today's date in the same timezone as the database (IST)
      // Since both server and DB are in IST, we can use local date
      const today = new Date();
      const todayStr = today.getFullYear() + '-' +
                       String(today.getMonth() + 1).padStart(2, '0') + '-' +
                       String(today.getDate()).padStart(2, '0');

      const loginDateStrings = loginDates.map((row: any) => row.login_date);

      console.log('Today (IST):', todayStr);
      console.log('Login date strings:', loginDateStrings);

      // Check consecutive days starting from today backwards
      let checkDate = new Date(today);
      let streakBroken = false;

      while (!streakBroken) {
        const checkDateStr = checkDate.getFullYear() + '-' +
                            String(checkDate.getMonth() + 1).padStart(2, '0') + '-' +
                            String(checkDate.getDate()).padStart(2, '0');
        const hasLoginOnDate = loginDateStrings.includes(checkDateStr);

        console.log(`Checking ${checkDateStr}: ${hasLoginOnDate ? 'YES' : 'NO'}`);

        if (hasLoginOnDate) {
          currentStreak++;
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          streakBroken = true;
        }
      }

      console.log('Final streak:', currentStreak);
    }

    ApiResponseUtil.success(res, {
      totalLogins,
      currentStreak
    }, "Login statistics retrieved successfully");

  } catch (error) {
    next(error);
  }
};