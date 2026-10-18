/**
 * File validation module for Clausy agreement uploads.
 * Validates file count, MIME type, file extension fallback, HEIC/HEIF detection, and size limit.
 */

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const HEIC_FRIENDLY_MESSAGE =
  "Please use a JPG or PNG photo (on iPhone choose Most Compatible).";

export interface FileValidationSuccess {
  valid: true;
  files: File[];
}

export interface FileValidationFailure {
  valid: false;
  error: string;
}

export type FileValidationResult = FileValidationSuccess | FileValidationFailure;

/**
 * Checks if a file is an iPhone HEIC/HEIF photo.
 */
export function isHeicFile(file: { name: string; type?: string }): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    ext === ".heic" ||
    ext === ".heif"
  );
}

/**
 * Validates whether a single file is an accepted image (JPG or PNG).
 * Safely falls back to file extension when file.type is empty or generic.
 */
export function isAcceptedImageFile(file: { name: string; type?: string }): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const type = (file.type || "").toLowerCase();

  const isJpg =
    type === "image/jpeg" ||
    ext === ".jpg" ||
    ext === ".jpeg";

  const isPng =
    type === "image/png" ||
    ext === ".png";

  return isJpg || isPng;
}

/**
 * Validates a batch of incoming files against the upload rules.
 * Returns either a success result with valid files or a failure with a user-friendly error message.
 */
export function validateIncomingFiles(
  incomingFiles: File[] | FileList,
  currentCount: number = 0
): FileValidationResult {
  const filesArray: File[] = Array.from(incomingFiles);

  if (filesArray.length === 0) {
    return { valid: false, error: "No files selected." };
  }

  // 1. Check max files limit
  if (currentCount + filesArray.length > MAX_FILES) {
    return {
      valid: false,
      error: `Maximum ${MAX_FILES} pages allowed per agreement. You currently have ${currentCount}.`,
    };
  }

  // 2. Validate each file individually
  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];

    // Check HEIC / HEIF first to give the specific iPhone guidance
    if (isHeicFile(file)) {
      return {
        valid: false,
        error: HEIC_FRIENDLY_MESSAGE,
      };
    }

    // Check accepted JPG / PNG format (with extension fallback for systems with empty file.type)
    if (!isAcceptedImageFile(file)) {
      return {
        valid: false,
        error: `"${file.name}" is not supported. Please upload JPG or PNG images only.`,
      };
    }

    // Check size limit (max 10 MB per file)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `"${file.name}" exceeds the 10 MB limit (${sizeMb} MB).`,
      };
    }
  }

  return {
    valid: true,
    files: filesArray,
  };
}

/**
 * Formats byte size into human-readable KB or MB string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
