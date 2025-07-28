import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Cleaning up blob URLs with download parameter...')
    
    // Find all attachments with blob URLs that have download parameter
    const attachmentsWithDownload = await prisma.attachments.findMany({
      where: {
        url: {
          contains: 'blob.vercel-storage.com'
        }
      }
    })

    console.log(`Found ${attachmentsWithDownload.length} blob attachments`)

    const toUpdate = attachmentsWithDownload.filter(attachment => 
      attachment.url.includes('?download=1')
    )

    console.log(`Found ${toUpdate.length} URLs with download parameter that need cleaning`)

    if (toUpdate.length === 0) {
      return Response.json({ 
        message: 'No URLs need cleaning',
        updated: 0,
        total: attachmentsWithDownload.length
      })
    }

    // Update each attachment
    const updatePromises = toUpdate.map(async (attachment) => {
      const cleanUrl = attachment.url.replace('?download=1', '')
      console.log(`Updating: ${attachment.url} -> ${cleanUrl}`)
      
      return prisma.attachments.update({
        where: { id: attachment.id },
        data: { url: cleanUrl }
      })
    })

    await Promise.all(updatePromises)
    
    console.log(`✅ Successfully cleaned up ${toUpdate.length} blob URLs`)
    
    return Response.json({
      message: `Successfully cleaned up ${toUpdate.length} blob URLs`,
      updated: toUpdate.length,
      total: attachmentsWithDownload.length,
      cleaned: toUpdate.map(a => ({
        id: a.id,
        old: a.url,
        new: a.url.replace('?download=1', '')
      }))
    })
    
  } catch (error) {
    console.error('❌ Error cleaning up blob URLs:', error)
    return Response.json({ 
      error: "Failed to cleanup URLs",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
