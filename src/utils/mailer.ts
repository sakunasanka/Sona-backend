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
  // Process logo URL - convert local paths to base64 or use public URLs
  const processedLogoUrl = logoUrl ? getImageAsBase64(logoUrl) || undefined : undefined;
  
  const htmlTemplate = createEmailTemplate(content, processedLogoUrl);
  
  await transporter.sendMail({
    from: `"Sona" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: htmlTemplate
  });
};

