import { Request, Response } from "express";
import { adminAuth } from "../config/firebase";
import axios from "axios";
import { sendEmail } from "../utils/mailer";
import * as path from "path";

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY!;

export const signup = async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    res.status(201).json({
      message: "User created successfully",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );

    const { idToken, refreshToken, localId } = response.data;

    const userRecord = await adminAuth.getUser(localId);
    const displayName = userRecord.displayName;

    res.status(200).json({
      message: "Signed in successfully",
      uid: localId,
      idToken,
      refreshToken,
      displayName,
    });
  } catch (error: any) {
    console.error("Signin Error:", error?.response?.data || error.message);
    res.status(401).json({
      error: error?.response?.data?.error?.message || "Authentication failed",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

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