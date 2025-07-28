/**
 * Script to clean up blob URLs in the database
 * Removes ?download=1 parameter from Vercel Blob URLs in attachments table
 */

import { prisma } from '../lib/prisma'

async function cleanupBlobUrls() {
  try {
    console.log('🔍 Searching for blob URLs with download parameter...')
    
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
      console.log('✅ No URLs need cleaning')
      return
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
    
  } catch (error) {
    console.error('❌ Error cleaning up blob URLs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupBlobUrls()
