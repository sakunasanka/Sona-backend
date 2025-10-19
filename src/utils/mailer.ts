import nodemailer from 'nodemailer'
import { createEmailTemplate } from '../template/mailtemplate';
import * as fs from 'fs';
import * as path from 'path';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,      // e.g., your.email@gmail.com
    pass: process.env.GMAIL_PASS,    
  },
});

// Helper function to convert local image to base64
const getImageAsBase64 = (imagePath: string): string | null => {
  try {
    // Check if it's a local path (not a URL)
    if (!imagePath.startsWith('http') && !imagePath.startsWith('https')) {
      const fullPath = path.resolve(imagePath);
      if (fs.existsSync(fullPath)) {
        const imageBuffer = fs.readFileSync(fullPath);
        const imageExtension = path.extname(fullPath).toLowerCase();
        const mimeType = imageExtension === '.png' ? 'image/png' : 
                        imageExtension === '.jpg' || imageExtension === '.jpeg' ? 'image/jpeg' :
                        imageExtension === '.gif' ? 'image/gif' : 'image/png';
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      }
    }
    return imagePath; // Return as is if it's already a URL
  } catch (error) {
    console.warn('Could not load image:', imagePath, error);
    return null;
  }
};

export const sendEmail = async (
  to: string, 
  subject: string, 
  content: string, 
  logoUrl?: string
) => {
  try { // <-- Add try
    const processedLogoUrl = logoUrl ? getImageAsBase64(logoUrl) || undefined : undefined;
    const htmlTemplate = createEmailTemplate(content, processedLogoUrl); // Assume this function exists

    console.log(`Attempting to send email to ${to} with subject "${subject}"`); // Add logging

    const info = await transporter.sendMail({ // Store result in 'info'
      from: `"Sona" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html: htmlTemplate
    });

    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`); // Log success

  } catch (error) { // <-- Add catch
    console.error(`Error sending email to ${to}:`, error);
    // Re-throw the error or handle it appropriately
    // Depending on your application structure, you might want to:
    // throw new Error(`Failed to send email: ${error.message}`);
    // Or return a specific error object/boolean
  }
};

