const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testImageCompression() {
  console.log("🧪 Testing Image Compression...");
  
  // Create a test directory if it doesn't exist
  const testDir = path.join(__dirname, '..', 'test-images');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Create a large test image (simulate a large file)
  const width = 3000;
  const height = 2000;
  const testImagePath = path.join(testDir, 'test-large.jpg');
  
  console.log(`📸 Creating test image: ${width}x${height} pixels`);
  
  // Create a test image with some content
  const testImage = sharp({
    create: {
      width: width,
      height: height,
      channels: 3,
      background: { r: 255, g: 100, b: 100 }
    }
  });
  
  // Add some text to make it more realistic
  const svgText = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="rgb(255,100,100)"/>
      <text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle">
        Test Image ${width}x${height}
      </text>
      <text x="50%" y="60%" font-family="Arial" font-size="30" fill="white" text-anchor="middle">
        This is a test image for compression
      </text>
    </svg>
  `;
  
  await testImage
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toFile(testImagePath);
  
  // Read the file and test compression
  const originalBuffer = fs.readFileSync(testImagePath);
  console.log(`📁 Original file size: ${(originalBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxDimensions = 2048;
  
  console.log(`🎯 Target: < ${(maxSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Test the compression logic
  let buffer = originalBuffer;
  let processed = false;
  
  if (buffer.length > maxSize) {
    console.log("🔄 Starting compression...");
    
    try {
      let sharpImg = sharp(buffer).rotate();
      const metadata = await sharpImg.metadata();
      
      console.log(`📏 Original dimensions: ${metadata.width}x${metadata.height}`);
      
      // Resize if needed
      if (metadata.width && metadata.width > maxDimensions) {
        sharpImg = sharpImg.resize(maxDimensions, null, { withoutEnlargement: true });
        console.log(`📐 Resized width to ${maxDimensions}px`);
      }
      if (metadata.height && metadata.height > maxDimensions) {
        sharpImg = sharpImg.resize(null, maxDimensions, { withoutEnlargement: true });
        console.log(`📐 Resized height to ${maxDimensions}px`);
      }
      
      // Try WebP compression
      let quality = 85;
      let webpBuffer = await sharpImg.webp({ quality }).toBuffer();
      
      console.log(`🔄 WebP compression (quality ${quality}): ${(webpBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      while (webpBuffer.length > maxSize && quality > 20) {
        quality -= 15;
        webpBuffer = await sharpImg.webp({ quality }).toBuffer();
        console.log(`🔄 WebP compression (quality ${quality}): ${(webpBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      }
      
      if (webpBuffer.length <= maxSize) {
        buffer = webpBuffer;
        processed = true;
        console.log(`✅ WebP compression successful: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
      } else {
        // Try JPEG
        console.log("🔄 WebP too large, trying JPEG compression");
        quality = 85;
        let jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer();
        
        while (jpgBuffer.length > maxSize && quality > 20) {
          quality -= 15;
          jpgBuffer = await sharpImg.jpeg({ quality }).toBuffer();
          console.log(`🔄 JPEG compression (quality ${quality}): ${(jpgBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        }
        
        if (jpgBuffer.length <= maxSize) {
          buffer = jpgBuffer;
          processed = true;
          console.log(`✅ JPEG compression successful: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        }
      }
    } catch (err) {
      console.error("❌ Compression error:", err);
    }
  }
  
  // Final result
  const finalSize = (buffer.length / 1024 / 1024).toFixed(2);
  const compressionRatio = ((originalBuffer.length - buffer.length) / originalBuffer.length * 100).toFixed(1);
  
  console.log("\n📊 Compression Results:");
  console.log(`   Original: ${(originalBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Final: ${finalSize} MB`);
  console.log(`   Compression: ${compressionRatio}%`);
  console.log(`   Under limit: ${buffer.length <= maxSize ? "✅ Yes" : "❌ No"}`);
  
  // Save the compressed version
  const compressedPath = path.join(testDir, 'test-compressed.jpg');
  fs.writeFileSync(compressedPath, buffer);
  console.log(`💾 Compressed image saved: ${compressedPath}`);
  
  return buffer.length <= maxSize;
}

// Run the test
testImageCompression().then(success => {
  if (success) {
    console.log("\n🎉 Image compression test passed!");
  } else {
    console.log("\n❌ Image compression test failed!");
  }
}).catch(error => {
  console.error("❌ Test error:", error);
}); 