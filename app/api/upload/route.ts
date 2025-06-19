import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const files = data.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const maxSize = 1 * 1024 * 1024 // 1MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    const uploadPromises = files.map(async (file) => {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${file.name}: ${file.type}`)
      }

      let buffer = Buffer.from(await file.arrayBuffer())
      let outputExt = "webp"
      let outputMime = "image/webp"
      let filenameBase = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`.replace(/\.[^.]+$/, "")
      let filename = `${filenameBase}.webp`
      let outputPath = join(process.cwd(), "public/uploads", filename)
      let processed = false

      // If file is too large, resize/compress
      if (buffer.length > maxSize || file.type !== "image/webp") {
        try {
          let sharpImg = sharp(buffer).rotate()
          // Resize only if image is too large
          const metadata = await sharpImg.metadata()
          // Try to keep original dimensions, but compress quality
          let quality = 80
          let webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          // If still too large, reduce quality further
          while (webpBuffer.length > maxSize && quality > 30) {
            quality -= 10
            webpBuffer = await sharpImg.webp({ quality }).toBuffer()
          }
          if (webpBuffer.length <= maxSize) {
            buffer = webpBuffer
            processed = true
          }
        } catch (err) {
          // If webp conversion fails, fallback to jpg
          outputExt = "jpg"
          outputMime = "image/jpeg"
          filename = `${filenameBase}.jpg`
          outputPath = join(process.cwd(), "public/uploads", filename)
          let sharpImg = sharp(buffer).rotate()
          let quality = 80
          let jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          while (jpgBuffer.length > maxSize && quality > 30) {
            quality -= 10
            jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer()
          }
          buffer = jpgBuffer
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
