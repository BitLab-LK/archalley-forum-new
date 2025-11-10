import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRolePermissions } from "@/lib/role-permissions"
import { uploadAdImageToBlob, validateAdImage, deleteAdImageFromBlob } from "@/lib/blob-storage"

// Force this route to run in Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Rate limiting for ad image uploads
const uploadAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userAttempts = uploadAttempts.get(userId)
  
  if (!userAttempts || now > userAttempts.resetTime) {
    uploadAttempts.set(userId, { count: 1, resetTime: now + 300000 }) // 5 minute window for ads
    return true
  }
  
  if (userAttempts.count >= 5) { // Max 5 ad uploads per 5 minutes
    return false
  }
  
  userAttempts.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to create/edit ads
    const userRole = session.user.role
    const permissions = getRolePermissions(userRole || 'MEMBER')
    if (!permissions.canCreateAds && !permissions.canEditAds) {
      return NextResponse.json({ 
        error: "Insufficient permissions to upload advertisement images" 
      }, { status: 403 })
    }

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Please wait before uploading more advertisement images." 
      }, { status: 429 })
    }

    const data = await request.formData()
    const files = data.getAll("adImages") as File[]
    const adId = data.get("adId") as string | null

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No advertisement images uploaded" }, { status: 400 })
    }

    // Limit number of files (ads usually need just one image)
    if (files.length > 3) {
      return NextResponse.json({ 
        error: "Maximum 3 images allowed per advertisement" 
      }, { status: 400 })
    }

    const uploadedImages = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Validate the advertisement image
        const validation = validateAdImage(file)
        if (!validation.valid) {
          errors.push(`File ${i + 1}: ${validation.error}`)
          continue
        }

        console.log(`📤 Uploading advertisement image: ${file.name} (${file.size} bytes)`)

        // Upload to Azure Blob Storage
        const result = await uploadAdImageToBlob(file, file.name, { 
          adId: adId || undefined,
          cacheControlMaxAge: 60 * 60 * 24 * 365 // 1 year cache for ads
        })

        uploadedImages.push(result)
        console.log(`✅ Advertisement image uploaded successfully: ${result.url}`)

      } catch (error) {
        console.error(`❌ Failed to upload advertisement image ${file.name}:`, error)
        errors.push(`File ${i + 1}: Upload failed - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Return results
    if (uploadedImages.length === 0) {
      return NextResponse.json({
        error: "All advertisement image uploads failed",
        details: errors
      }, { status: 400 })
    }

    const response = {
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} advertisement image(s)`,
      images: uploadedImages,
      userId: session.user.id
    }

    if (errors.length > 0) {
      response.message += ` (${errors.length} failed)`
      ;(response as any).errors = errors
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Advertisement image upload API error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error during advertisement image upload",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to delete ads
    const userRole = session.user.role
    const permissions = getRolePermissions(userRole || 'MEMBER')
    if (!permissions.canDeleteAds && !permissions.canEditAds) {
      return NextResponse.json({ 
        error: "Insufficient permissions to delete advertisement images" 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 })
    }

    console.log(`🗑️ Deleting advertisement image: ${imageUrl}`)

    // Delete from Azure Blob Storage
    await deleteAdImageFromBlob(imageUrl)

    return NextResponse.json({
      success: true,
      message: "Advertisement image deleted successfully",
      deletedUrl: imageUrl
    })

  } catch (error) {
    console.error("Advertisement image delete API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to delete advertisement image",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}