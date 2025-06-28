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

    // Configurable file size limits
    const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || "5242880") // 5MB default
    const maxDimensions = parseInt(process.env.UPLOAD_MAX_DIMENSIONS || "2048") // 2048px default
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    console.log(`📁 Upload settings: maxSize=${maxSize} bytes, maxDimensions=${maxDimensions}px`)

    const uploadPromises = files.map(async (file) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${file.name}: ${file.type}`)
      }

      let buffer = Buffer.from(await file.arrayBuffer()) as Buffer
      let outputExt = "webp"
      let outputMime = "image/webp"
      let sanitizedFilename = sanitizeFilename(file.name)
      let filenameBase = `${Date.now()}-${sanitizedFilename}`.replace(/\.[^.]+$/, "")
      let filename = `${filenameBase}.webp`
      let outputPath = join(process.cwd(), "public/uploads", filename)
      let processed = false

      // Always process images that are too large or not in optimal format
      if (buffer.length > maxSize || file.type !== "image/webp") {
        try {
          console.log(`🖼️ Processing image: ${file.name} (${buffer.length} bytes)`)
          
          let sharpImg = sharp(buffer).rotate()
          const metadata = await sharpImg.metadata()
          
          console.log(`📏 Original dimensions: ${metadata.width}x${metadata.height}`)
          
          // Resize if image dimensions are too large
          if (metadata.width && metadata.width > maxDimensions) {
            sharpImg = sharpImg.resize(maxDimensions, null, { withoutEnlargement: true })
            console.log(`📐 Resized width to ${maxDimensions}px`)
          }
          if (metadata.height && metadata.height > maxDimensions) {
            sharpImg = sharpImg.resize(null, maxDimensions, { withoutEnlargement: true })
            console.log(`📐 Resized height to ${maxDimensions}px`)
          }
          
          // Try WebP compression first
          let quality = 85
          let webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          
          console.log(`🔄 WebP compression (quality ${quality}): ${webpBuffer.length} bytes`)
          
          // If still too large, reduce quality progressively
          while (webpBuffer.length > maxSize && quality > 20) {
            quality -= 15
            webpBuffer = await sharpImg.webp({ quality }).toBuffer()
            console.log(`🔄 WebP compression (quality ${quality}): ${webpBuffer.length} bytes`)
          }
          
          if (webpBuffer.length <= maxSize) {
            buffer = webpBuffer as Buffer
            processed = true
            console.log(`✅ WebP compression successful: ${buffer.length} bytes`)
          } else {
            // If WebP still too large, try JPEG
            console.log(`🔄 WebP too large, trying JPEG compression`)
            quality = 85
            let jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
            
            while (jpgBuffer.length > maxSize && quality > 20) {
              quality -= 15
              jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
              console.log(`🔄 JPEG compression (quality ${quality}): ${jpgBuffer.length} bytes`)
            }
            
            if (jpgBuffer.length <= maxSize) {
              buffer = jpgBuffer as Buffer
              outputExt = "jpg"
              outputMime = "image/jpeg"
              filename = `${filenameBase}.jpg`
              outputPath = join(process.cwd(), "public/uploads", filename)
              processed = true
              console.log(`✅ JPEG compression successful: ${buffer.length} bytes`)
            }
          }
        } catch (err) {
          console.error(`❌ Image processing error for ${file.name}:`, err)
          // If processing fails, we'll continue with original file
        }
      }

      // If not processed and still too large, try one more aggressive compression
      if (!processed && buffer.length > maxSize) {
        try {
          console.log(`🔄 Final compression attempt for ${file.name}`)
          let sharpImg = sharp(buffer).rotate()
          
          // Get metadata
          const metadata = await sharpImg.metadata()
          
          // More aggressive resizing
          let targetWidth = metadata.width
          let targetHeight = metadata.height
          
          if (metadata.width && metadata.width > maxDimensions) {
            targetWidth = maxDimensions
          }
          if (metadata.height && metadata.height > maxDimensions) {
            targetHeight = maxDimensions
          }
          
          sharpImg = sharpImg.resize(targetWidth, targetHeight, { withoutEnlargement: true })
          
          // Try very low quality compression
          let quality = 50
          let compressedBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          
          while (compressedBuffer.length > maxSize && quality > 10) {
            quality -= 10
            compressedBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          }
          
          if (compressedBuffer.length <= maxSize) {
            buffer = compressedBuffer as Buffer
            outputExt = "jpg"
            outputMime = "image/jpeg"
            filename = `${filenameBase}.jpg`
            outputPath = join(process.cwd(), "public/uploads", filename)
            processed = true
            console.log(`✅ Final compression successful: ${buffer.length} bytes`)
          }
        } catch (err) {
          console.error(`❌ Final compression failed for ${file.name}:`, err)
        }
      }

      // If still too large after all processing attempts, throw error
      if (buffer.length > maxSize) {
        throw new Error(`File too large after processing: ${file.name} (${buffer.length} bytes, max: ${maxSize} bytes)`)
      }

      // Write file
      await writeFile(outputPath, buffer)
      console.log(`💾 File saved: ${filename} (${buffer.length} bytes)`)

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
      
      // Provide user-friendly error messages
      let errorMessage = "File processing failed"
      let errorDetails = ""
      
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024))
          errorMessage = `File is too large. Maximum size allowed is ${maxSizeMB}MB.`
          errorDetails = "The image has been compressed as much as possible but is still too large. Please try a smaller image."
        } else if (error.message.includes("Invalid file type")) {
          errorMessage = "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        } else {
          errorMessage = error.message
          errorDetails = error.stack || ""
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: errorDetails || "",
        maxFileSize: `${Math.round(maxSize / (1024 * 1024))}MB`,
        allowedTypes: allowedTypes
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
