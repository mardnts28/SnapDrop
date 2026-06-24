"use server";

export interface UploadResult {
  success: boolean;
  message: string;
  fileId?: string;
}

export async function uploadFileAction(
  base64Data: string,
  mimeType: string = "image/jpeg",
  fileName?: string
): Promise<UploadResult> {
  try {
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

    if (!scriptUrl) {
      console.error("Upload failed: Missing GOOGLE_APPS_SCRIPT_URL.");
      return {
        success: false,
        message: "Server configuration error: Apps Script URL not found.",
      };
    }

    // Determine default filename if not provided
    const extension = mimeType.split("/")[1] || "jpg";
    const name = fileName || `snap_${new Date().toISOString().replace(/[:.]/g, "-")}.${extension === "jpeg" ? "jpg" : extension}`;

    // POST the base64 file to the Google Apps Script web app
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileData: base64Data,
        mimeType,
        fileName: name,
        folderId,
      }),
      redirect: "follow",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apps Script returned error:", response.status, errorText);
      return {
        success: false,
        message: `Upload failed with status ${response.status}.`,
      };
    }

    const result = await response.json();

    if (result.success) {
      console.log(`Successfully uploaded file to Google Drive. File ID: ${result.fileId}`);
      return {
        success: true,
        message: "File uploaded successfully to Google Drive.",
        fileId: result.fileId,
      };
    } else {
      console.error("Apps Script reported failure:", result.message);
      return {
        success: false,
        message: result.message || "Upload failed on the Apps Script side.",
      };
    }
  } catch (error: any) {
    console.error("Error occurred during upload:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred during upload.",
    };
  }
}

