"use server";

import { google } from "googleapis";
import { Readable } from "stream";

export interface UploadResult {
  success: boolean;
  message: string;
  fileId?: string;
}

export async function uploadImageAction(
  base64Data: string
): Promise<UploadResult> {
  try {
    // 1. Authentication & Environment Parsing
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Parse private key safely, accounting for escaped newlines in environment variables
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!serviceAccountEmail || !privateKey) {
      console.error("Upload failed: Missing Google Service Account configuration.");
      return {
        success: false,
        message: "Server configuration error: Google Service Account credentials not found.",
      };
    }

    // Initialize JWT client with service account credentials
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    // 2. Data Conversion & Stream Handling
    // Strip out base64 prefixes if present
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    
    // Convert to binary buffer
    const buffer = Buffer.from(cleanBase64, "base64");
    
    // Convert buffer into a readable stream for drive API body
    const bufferStream = Readable.from(buffer);

    // 3. Google Drive Upload Request
    const drive = google.drive({ version: "v3", auth: jwtClient });

    // Generate snapshot filename using ISO-style timestamp formatted safely
    const fileName = `snap_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;

    // Configure request options
    const requestBody: any = {
      name: fileName,
      mimeType: "image/jpeg",
    };

    // Add parent folder if configured
    if (folderId) {
      requestBody.parents = [folderId];
    }

    // Send creation request to Drive API
    const response = await drive.files.create({
      requestBody,
      media: {
        mimeType: "image/jpeg",
        body: bufferStream,
      },
      fields: "id, name",
    });

    const fileId = response.data.id || undefined;
    console.log(`Successfully uploaded image to Google Drive. File ID: ${fileId}`);

    return {
      success: true,
      message: "Image uploaded successfully to Google Drive.",
      fileId,
    };
  } catch (error: any) {
    console.error("Error occurred during Google Drive upload:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during upload.",
    };
  }
}
