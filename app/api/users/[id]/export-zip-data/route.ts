import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get complete user data
    const userData = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        website: true,
        company: true,
        profession: true,
        linkedinUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        githubUrl: true,
        createdAt: true,
        lastActiveAt: true,
        skills: true,
        industry: true,
        country: true,
        city: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        headline: true,
        portfolioUrl: true,
        facebookUrl: true,
        emailNotifications: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        notifyOnReply: true,
        notifyOnNewPost: true,
        notifyOnSystem: true,
        emailDigest: true,
        profileVisibility: true,
        workExperience: {
          select: {
            jobTitle: true,
            company: true,
            startDate: true,
            endDate: true,
            description: true
          }
        },
        education: {
          select: {
            degree: true,
            institution: true,
            startDate: true,
            endDate: true,
            description: true
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's posts with attachments
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        categoryIds: true,
        categories: {
          select: {
            name: true
          }
        },
        attachments: {
          select: {
            filename: true,
            url: true,
            mimeType: true,
            size: true
          }
        },
        Comment: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user's comments
    const userComments = await prisma.comment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        Post: {
          select: {
            title: true,
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create ZIP file
    const zip = new JSZip();

    // 1. Create user profile data as text file
    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name;
    const location = `${userData.city || ''} ${userData.country || ''}`.trim() || 'N/A';
    
    const profileData = `
ARCHALLEY FORUM - USER DATA EXPORT
===================================
Export Date: ${new Date().toLocaleString()}
Export Type: Complete Data Archive

PROFILE INFORMATION
==================
Full Name: ${fullName}
Email: ${userData.email}
Headline: ${userData.headline || 'N/A'}
Bio: ${userData.bio || 'N/A'}
Company: ${userData.company || 'N/A'}
Profession: ${userData.profession || 'N/A'}
Industry: ${userData.industry || 'N/A'}
Location: ${location}
Phone: ${userData.phoneNumber || 'N/A'}
Website: ${userData.website || 'N/A'}
Portfolio: ${userData.portfolioUrl || 'N/A'}
Skills: ${userData.skills ? userData.skills.join(', ') : 'N/A'}
Member Since: ${userData.createdAt?.toLocaleDateString() || 'N/A'}
Last Active: ${userData.lastActiveAt?.toLocaleDateString() || 'N/A'}

SOCIAL MEDIA LINKS
==================
LinkedIn: ${userData.linkedinUrl || 'N/A'}
Twitter: ${userData.twitterUrl || 'N/A'}
Instagram: ${userData.instagramUrl || 'N/A'}
GitHub: ${userData.githubUrl || 'N/A'}
Facebook: ${userData.facebookUrl || 'N/A'}

WORK EXPERIENCE
===============
${userData.workExperience.map((work, index) => `
${index + 1}. ${work.jobTitle || 'N/A'} at ${work.company || 'N/A'}
   Duration: ${work.startDate || 'N/A'} - ${work.endDate || 'Present'}
   Description: ${work.description || 'N/A'}
`).join('') || 'No work experience recorded'}

EDUCATION
=========
${userData.education.map((edu, index) => `
${index + 1}. ${edu.degree || 'N/A'} at ${edu.institution || 'N/A'}
   Duration: ${edu.startDate || 'N/A'} - ${edu.endDate || 'Present'}
   Description: ${edu.description || 'N/A'}
`).join('') || 'No education records'}

PRIVACY & NOTIFICATION SETTINGS
===============================
Profile Visibility: ${userData.profileVisibility ? 'Public' : 'Private'}
Email Notifications: ${userData.emailNotifications ? 'Enabled' : 'Disabled'}
Comment Notifications: ${userData.notifyOnComment ? 'Enabled' : 'Disabled'}
Like Notifications: ${userData.notifyOnLike ? 'Enabled' : 'Disabled'}
Mention Notifications: ${userData.notifyOnMention ? 'Enabled' : 'Disabled'}
Reply Notifications: ${userData.notifyOnReply ? 'Enabled' : 'Disabled'}
New Post Notifications: ${userData.notifyOnNewPost ? 'Enabled' : 'Disabled'}
System Notifications: ${userData.notifyOnSystem ? 'Enabled' : 'Disabled'}
Email Digest: ${userData.emailDigest || 'N/A'}

ACTIVITY SUMMARY
===============
Total Posts: ${userPosts.length}
Total Comments: ${userComments.length}
    `;

    zip.file("profile_data.txt", profileData);

    // 2. Create posts data file
    const postsData = `
ARCHALLEY FORUM - POSTS DATA
============================
Total Posts: ${userPosts.length}

${userPosts.map((post, index) => `
POST ${index + 1}
========
ID: ${post.id}
Title: ${post.title}
Category: ${post.categories?.name || 'Uncategorized'}
Multiple Categories: ${post.categoryIds?.length ? 'Yes (' + post.categoryIds.length + ' categories)' : 'No'}
Created: ${post.createdAt?.toLocaleString()}
Updated: ${post.updatedAt?.toLocaleString()}
Comments: ${post.Comment?.length || 0}
Attachments: ${post.attachments?.length || 0}
${post.attachments.length > 0 ? `Files: ${post.attachments.map(att => `${att.filename} (${att.mimeType})`).join(', ')}` : 'No files'}

Content:
${post.content || 'No content'}

----------------------------------------
`).join('')}
    `;

    zip.file("posts_data.txt", postsData);

    // 3. Create comments data file
    const commentsData = `
ARCHALLEY FORUM - COMMENTS DATA
===============================
Total Comments: ${userComments.length}

${userComments.map((comment, index) => `
COMMENT ${index + 1}
============
ID: ${comment.id}
On Post: ${comment.Post?.title || 'Unknown'}
Post ID: ${comment.Post?.id || 'Unknown'}
Created: ${comment.createdAt?.toLocaleString()}

Content:
${comment.content || 'No content'}

----------------------------------------
`).join('')}
    `;

    zip.file("comments_data.txt", commentsData);

    // 4. Add uploaded files to ZIP
    const filesFolder = zip.folder("attachments");
    const publicUploadsPath = path.join(process.cwd(), 'public', 'uploads');
    
    let fileCount = 0;
    
    for (const post of userPosts) {
      for (const attachment of post.attachments) {
        try {
          // Extract filename from URL (handle both full URLs and relative paths)
          const filename = path.basename(attachment.url);
          const filePath = path.join(publicUploadsPath, filename);
          
          // Check if file exists
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            filesFolder?.file(attachment.filename, fileBuffer);
            fileCount++;
          }
        } catch (error) {
          console.error(`Error adding attachment ${attachment.filename}:`, error);
        }
      }
    }

    // 5. Create a summary file
    const summaryData = `
ARCHALLEY FORUM - EXPORT SUMMARY
=================================
Export Date: ${new Date().toLocaleString()}
User: ${userData.name || 'Unknown'}
Email: ${userData.email}

CONTENTS OF THIS ARCHIVE
========================
✓ profile_data.txt - Complete profile information
✓ posts_data.txt - All posts (${userPosts.length} posts)
✓ comments_data.txt - All comments (${userComments.length} comments)
✓ attachments/ folder - Uploaded files (${fileCount} files)

NOTES
=====
- All data is exported in text format for maximum compatibility
- Images are stored in their original format in the images/ folder
- Post content includes references to image locations
- This export includes all data associated with your account
- Timestamps are in your local timezone

For questions about this export, contact support at ArchAlley Forum.
    `;

    zip.file("README.txt", summaryData);

    // Generate ZIP file as blob (web-compatible)
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Convert blob to ArrayBuffer for Response
    const zipBuffer = await zipBlob.arrayBuffer();

    // Return ZIP file as response using Response constructor
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="archalley_forum_export_${userData.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip"`,
        'Content-Length': zipBlob.size.toString()
      }
    });

  } catch (error) {
    console.error('ZIP export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
