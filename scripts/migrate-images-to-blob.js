// Migration script to move existing local images to Vercel Blob
const { put } = require('@vercel/blob')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function migrateExistingImages() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found')
    return
  }

  const files = fs.readdirSync(uploadsDir).filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  )

  console.log(`Found ${files.length} images to migrate`)

  const migrations = []

  for (const filename of files) {
    try {
      const filePath = path.join(uploadsDir, filename)
      const fileBuffer = fs.readFileSync(filePath)
      
      console.log(`Uploading ${filename}...`)
      
      const blob = await put(`migrated/${filename}`, fileBuffer, {
        access: 'public',
        addRandomSuffix: false // Keep original names for easier mapping
      })
      
      migrations.push({
        originalPath: `/uploads/${filename}`,
        newUrl: blob.url,
        filename,
        size: fileBuffer.length
      })
      
      console.log(`✅ Migrated ${filename} -> ${blob.url}`)
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${filename}:`, error.message)
    }
  }

  // Save migration mapping for database updates
  fs.writeFileSync(
    'image-migration-mapping.json', 
    JSON.stringify(migrations, null, 2)
  )

  console.log(`\n🎉 Migration complete!`)
  console.log(`${migrations.length} images migrated successfully`)
  console.log(`Mapping saved to: image-migration-mapping.json`)
  console.log(`\nNext steps:`)
  console.log(`1. Update your database to replace old URLs with new Blob URLs`)
  console.log(`2. Test your application`)
  console.log(`3. Remove local files once confirmed working`)
}

if (require.main === module) {
  migrateExistingImages().catch(console.error)
}

module.exports = { migrateExistingImages }
