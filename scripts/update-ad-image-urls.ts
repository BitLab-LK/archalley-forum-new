/**
 * Script to update advertisement image URLs from old domain to new domain
 * Changes: https://archalley.com/wp-content/ -> https://wp.archalley.com/wp-content/
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdImageUrls() {
  try {
    console.log('🔍 Starting advertisement image URL update...\n')

    // Find all advertisements with old domain in imageUrl
    const adsToUpdate = await prisma.advertisement.findMany({
      where: {
        imageUrl: {
          contains: 'https://archalley.com/wp-content/'
        }
      }
    })

    if (adsToUpdate.length === 0) {
      console.log('✅ No advertisements found with old image URLs. All up to date!')
      return
    }

    console.log(`📊 Found ${adsToUpdate.length} advertisement(s) with old image URLs:\n`)

    // Display what will be updated
    adsToUpdate.forEach((ad, index) => {
      const oldUrl = ad.imageUrl
      const newUrl = oldUrl.replace(
        'https://archalley.com/wp-content/',
        'https://wp.archalley.com/wp-content/'
      )
      console.log(`${index + 1}. ID: ${ad.id}`)
      console.log(`   Title: ${ad.title || 'Untitled'}`)
      console.log(`   Old URL: ${oldUrl}`)
      console.log(`   New URL: ${newUrl}`)
      console.log('')
    })

    // Perform the update
    console.log('🔄 Updating image URLs...\n')

    let updateCount = 0
    for (const ad of adsToUpdate) {
      const newUrl = ad.imageUrl.replace(
        'https://archalley.com/wp-content/',
        'https://wp.archalley.com/wp-content/'
      )

      await prisma.advertisement.update({
        where: { id: ad.id },
        data: {
          imageUrl: newUrl,
          updatedAt: new Date()
        }
      })

      updateCount++
      console.log(`✅ Updated: ${ad.id} - ${ad.title || 'Untitled'}`)
    }

    console.log(`\n✨ Successfully updated ${updateCount} advertisement image URL(s)!`)
    console.log('🎉 All advertisement images now point to wp.archalley.com\n')

  } catch (error) {
    console.error('❌ Error updating advertisement image URLs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateAdImageUrls()
  .then(() => {
    console.log('✅ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
