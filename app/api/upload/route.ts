import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import sharp from "sharp"

// Rate limiting map (in production, use Redis or similar)
const uploadAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userAttempts = uploadAttempts.get(userId)
  
  if (!userAttempts || now > userAttempts.resetTime) {
    uploadAttempts.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (userAttempts.count >= 10) { // Max 10 uploads per minute
    return false
  }
  
  userAttempts.count++
  return true
}

function sanitizeFilename(filename: string): string {
  // Remove any path traversal attempts and special characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100) // Limit length
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
    }

    const data = await request.formData()
    const files = data.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Limit number of files
    if (files.length > 5) {
      return NextResponse.json({ error: "Maximum 5 files allowed per upload" }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    const uploadPromises = files.map(async (file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${file.name}: ${file.type}`)
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File too large: ${file.name} (${file.size} bytes)`)
      }

      let buffer = Buffer.from(await file.arrayBuffer()) as Buffer
      let outputExt = "webp"
      let outputMime = "image/webp"
      let sanitizedFilename = sanitizeFilename(file.name)
      let filenameBase = `${Date.now()}-${sanitizedFilename}`.replace(/\.[^.]+$/, "")
      let filename = `${filenameBase}.webp`
      let outputPath = join(process.cwd(), "public/uploads", filename)
      let processed = false

      // If file is too large, resize/compress
      if (buffer.length > maxSize || file.type !== "image/webp") {
        try {
          let sharpImg = sharp(buffer).rotate()
          // Resize only if image is too large
          const metadata = await sharpImg.metadata()
          
          // Resize if image is too large
          if (metadata.width && metadata.width > 2048) {
            sharpImg = sharpImg.resize(2048, null, { withoutEnlargement: true })
          }
          if (metadata.height && metadata.height > 2048) {
            sharpImg = sharpImg.resize(null, 2048, { withoutEnlargement: true })
          }
          
          // Try to keep original dimensions, but compress quality
          let quality = 80
          let webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          // If still too large, reduce quality further
          while (webpBuffer.length > maxSize && quality > 30) {
            quality -= 10
            webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          }
          if (webpBuffer.length <= maxSize) {
            buffer = webpBuffer as Buffer
            processed = true
          }
        } catch (err) {
          // If webp conversion fails, fallback to jpg
          outputExt = "jpg"
          outputMime = "image/jpeg"
          filename = `${filenameBase}.jpg`
          outputPath = join(process.cwd(), "public/uploads", filename)
          let sharpImg = sharp(buffer).rotate()
          
          // Resize if image is too large
          const metadata = await sharpImg.metadata()
          if (metadata.width && metadata.width > 2048) {
            sharpImg = sharpImg.resize(2048, null, { withoutEnlargement: true })
          }
          if (metadata.height && metadata.height > 2048) {
            sharpImg = sharpImg.resize(null, 2048, { withoutEnlargement: true })
          }
          
          let quality = 80
          let jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          while (jpgBuffer.length > maxSize && quality > 30) {
            quality -= 10
            jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          }
          buffer = jpgBuffer as Buffer
          processed = true
        }
      }

      // If not processed and still too large, throw error
      if (!processed && buffer.length > maxSize) {
        throw new Error(`File too large after processing: ${file.name}`)
      }

      // Write file
      await writeFile(outputPath, buffer)

      return {
        url: `/uploads/${filename}`,
        name: file.name,
        size: buffer.length,
        type: outputMime
      }
    })

    try {
      const uploadedFiles = await Promise.all(uploadPromises)
      return NextResponse.json({ images: uploadedFiles })
    } catch (error) {
      console.error("File processing error:", error)
      return NextResponse.json({ 
        error: "File processing failed", 
        message: error instanceof Error ? error.message : "Failed to process files",
        details: error instanceof Error ? error.stack : undefined
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Upload failed",
      message: error instanceof Error ? error.message : "Failed to upload files",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
