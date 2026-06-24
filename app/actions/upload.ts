"use server";

export interface UploadResult {
  success: boolean;
  message: string;
  fileId?: string;
}

// Allowed base MIME type prefixes
const ALLOWED_MIME_PREFIXES = ["image/", "video/"];

export async function uploadFileAction(
  base64Data: string,
  mimeType: string = "image/jpeg",
  fileName?: string
): Promise<UploadResult> {
  try {
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
    const secretToken = process.env.UPLOAD_SECRET_TOKEN;

    if (!scriptUrl) {
      console.error("Upload failed: Missing GOOGLE_APPS_SCRIPT_URL.");
      return {
        success: false,
        message: "Server configuration error: Apps Script URL not found.",
      };
    }

    // ── Security: File type validation ──────────────────────────────────────
    // Strip codec details from MIME type (e.g. "video/webm; codecs=vp9" → "video/webm")
    const baseMimeType = mimeType.split(";")[0].trim().toLowerCase();

    const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
      baseMimeType.startsWith(prefix)
    );

    if (!isAllowed) {
      console.error(`Rejected upload: unsupported MIME type "${baseMimeType}".`);
      return {
        success: false,
        message: `File type "${baseMimeType}" is not allowed. Only images and videos are accepted.`,
      };
    }
    // ────────────────────────────────────────────────────────────────────────

    // Determine default filename
    const extension = baseMimeType.split("/")[1] || "jpg";
    const name =
      fileName ||
      `snap_${new Date().toISOString().replace(/[:.]/g, "-")}.${
        extension === "jpeg" ? "jpg" : extension
      }`;

    // Build request headers — include secret token if configured
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secretToken) {
      headers["X-Upload-Token"] = secretToken;
    }

    // POST the base64 file to the Google Apps Script web app
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        fileData: base64Data,
        mimeType: baseMimeType,
        fileName: name,
        folderId,
        // Also include token in body as a fallback (Apps Script reads body, not headers)
        token: secretToken || "",
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
      console.log(
        `Successfully uploaded file to Google Drive. File ID: ${result.fileId}`
      );
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
