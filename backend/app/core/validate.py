from fastapi import HTTPException, UploadFile

MAX_FILES = 5
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_QUESTION_LENGTH = 500

JPEG_SIGNATURE = b"\xff\xd8\xff"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def is_valid_jpeg(header: bytes) -> bool:
    return len(header) >= 3 and header.startswith(JPEG_SIGNATURE)


def is_valid_png(header: bytes) -> bool:
    return len(header) >= 8 and header.startswith(PNG_SIGNATURE)


async def validate_image_file(file: UploadFile) -> bytes:
    """
    Validates a single image file for:
    1. Size <= 10MB
    2. Real file signature (magic bytes: JPEG or PNG)
    """
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is empty."
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' exceeds the maximum allowed size of 10 MB."
        )

    header = content[:8]
    if not (is_valid_jpeg(header) or is_valid_png(header)):
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid JPEG or PNG image (invalid magic bytes signature)."
        )

    return content


async def validate_upload_files(files: list[UploadFile]) -> list[bytes]:
    """
    Validates a batch of uploaded files:
    1. Between 1 and 5 files
    2. Each file is a valid JPEG/PNG and under 10MB
    """
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="At least one agreement page image is required."
        )

    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum allowed is {MAX_FILES} pages."
        )

    contents: list[bytes] = []
    for f in files:
        content = await validate_image_file(f)
        contents.append(content)

    return contents


def validate_question(question: str) -> str:
    """
    Validates user question string:
    1. Non-empty
    2. Capped at 500 characters
    """
    if not question or not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    clean = question.strip()
    if len(clean) > MAX_QUESTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Question exceeds maximum length of {MAX_QUESTION_LENGTH} characters."
        )

    return clean
