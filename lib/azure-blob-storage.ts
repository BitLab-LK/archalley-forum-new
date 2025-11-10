/**
 * Azure Blob Storage Utility
 * Handles all Azure Blob Storage operations
 */

import { 
  BlobServiceClient, 
  ContainerClient, 
  BlockBlobClient,
  StorageSharedKeyCredential 
} from '@azure/storage-blob';

// Get Azure Storage configuration
function getAzureConfig() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!connectionString && (!accountName || !accountKey)) {
    throw new Error('Azure Storage configuration missing. Please set AZURE_STORAGE_CONNECTION_STRING or both AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY');
  }

  return {
    connectionString,
    accountName,
    accountKey,
  };
}

// Get or create BlobServiceClient
function getBlobServiceClient(): BlobServiceClient {
  const config = getAzureConfig();

  if (config.connectionString) {
    return BlobServiceClient.fromConnectionString(config.connectionString);
  } else {
    // Use account name and key
    const accountUrl = `https://${config.accountName}.blob.core.windows.net`;
    const sharedKeyCredential = new StorageSharedKeyCredential(config.accountName!, config.accountKey!);
    return new BlobServiceClient(accountUrl, sharedKeyCredential);
  }
}

// Get container client (creates container if it doesn't exist)
async function getContainerClient(containerName: string = 'uploads'): Promise<ContainerClient> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Create container if it doesn't exist (with public access)
  try {
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access
    });
  } catch (error) {
    console.error(`Error creating container ${containerName}:`, error);
    throw error;
  }

  return containerClient;
}

// Generate public URL for a blob
function getBlobUrl(containerName: string, blobName: string): string {
  const config = getAzureConfig();
  let accountName = config.accountName;
  
  // If account name not provided, try to extract from connection string
  if (!accountName && config.connectionString) {
    const match = config.connectionString.match(/AccountName=([^;]+)/);
    accountName = match ? match[1] : null;
  }
  
  if (!accountName) {
    throw new Error('Unable to determine Azure Storage account name. Please set AZURE_STORAGE_ACCOUNT_NAME or include it in the connection string.');
  }

  // Azure Blob Storage URLs use the blob name as-is (forward slashes are part of the path structure)
  // Only encode special characters that aren't part of the path structure
  const encodedBlobName = blobName.split('/').map(segment => encodeURIComponent(segment)).join('/');
  
  return `https://${accountName}.blob.core.windows.net/${containerName}/${encodedBlobName}`;
}

// Upload file to Azure Blob Storage
export interface AzureUploadOptions {
  containerName?: string;
  contentType?: string;
  addRandomSuffix?: boolean;
  cacheControl?: string;
}

export interface AzureUploadResult {
  url: string;
  pathname: string;
  filename: string;
  size: number;
  contentType: string;
  downloadUrl: string;
}

export async function uploadToAzureBlob(
  file: File | Buffer,
  filename: string,
  options: AzureUploadOptions = {}
): Promise<AzureUploadResult> {
  try {
    const containerName = options.containerName || 'uploads';
    const containerClient = await getContainerClient(containerName);

    // Add random suffix if requested
    let blobName = filename;
    if (options.addRandomSuffix) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const ext = filename.split('.').pop();
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
      blobName = `${nameWithoutExt}-${randomSuffix}.${ext}`;
    }

    // Ensure blob name doesn't start with /
    blobName = blobName.replace(/^\//, '');

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Determine content type
    const contentType = options.contentType || 
      (file instanceof File ? file.type : 'application/octet-stream');

    // Prepare upload options
    const uploadOptions: any = {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    };

    if (options.cacheControl) {
      uploadOptions.blobHTTPHeaders.blobCacheControl = options.cacheControl;
    }

    // Upload file
    const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);

    // Generate public URL
    const url = getBlobUrl(containerName, blobName);

    return {
      url,
      pathname: blobName,
      filename: blobName,
      size: fileBuffer.length,
      contentType,
      downloadUrl: url, // Same as URL for public blobs
    };
  } catch (error) {
    console.error('Azure Blob upload error:', error);
    throw new Error(`Failed to upload to Azure Blob Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Delete file from Azure Blob Storage
export async function deleteFromAzureBlob(
  url: string,
  containerName?: string
): Promise<void> {
  try {
    // Parse URL to extract container and blob name
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid blob URL format');
    }

    const extractedContainerName = containerName || pathParts[0];
    const blobName = pathParts.slice(1).join('/');

    const containerClient = await getContainerClient(extractedContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();
    console.log(`🗑️ Deleted blob: ${url}`);
  } catch (error) {
    console.error('Azure Blob delete error:', error);
    throw new Error(`Failed to delete from Azure Blob Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if blob exists
export async function blobExists(url: string, containerName?: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    
    if (pathParts.length < 2) {
      return false;
    }

    const extractedContainerName = containerName || pathParts[0];
    const blobName = pathParts.slice(1).join('/');

    const containerClient = await getContainerClient(extractedContainerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    return await blockBlobClient.exists();
  } catch (error) {
    console.error('Azure Blob exists check error:', error);
    return false;
  }
}

