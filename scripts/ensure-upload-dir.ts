import { mkdir } from "fs/promises"
import { join } from "path"

async function ensureUploadDir() {
  try {
    const uploadDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    console.log("Upload directory created/verified at:", uploadDir)
  } catch (error) {
    console.error("Error creating upload directory:", error)
    process.exit(1)
  }
}

ensureUploadDir() 