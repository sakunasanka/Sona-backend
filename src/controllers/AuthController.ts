import { Request, Response } from "express";
import { adminAuth } from "../config/firebase";
import axios from "axios";

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
    await adminAuth.generatePasswordResetLink(email);
    res.status(200).json({
      message: "Password reset link sent to email",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    res.status(400).json({ error: error.message });
  }
}