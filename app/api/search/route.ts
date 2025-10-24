import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'posts', 'members', 'all'
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        posts: [],
        members: [],
        totalPosts: 0,
        totalMembers: 0,
        currentPage: page,
        totalPages: 0
      });
    }

    const searchTerm = query.trim();
    const results: any = {
      posts: [],
      members: [],
      totalPosts: 0,
      totalMembers: 0,
      currentPage: page,
      totalPages: 0
    };

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const [posts, postsCount] = await Promise.all([
        prisma.post.findMany({
          where: {
            OR: [
              {
                content: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                users: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              },
              {
                users: {
                  firstName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              },
              {
                users: {
                  lastName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              }
            ]
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            users: {
              select: {
                id: true,
                name: true,
                image: true,
                headline: true
              }
            },
            primaryCategory: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            postCategories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                }
              }
            },
            _count: {
              select: {
                Comment: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: type === 'posts' ? limit : Math.min(limit, 10),
          skip: type === 'posts' ? offset : 0
        }),
        prisma.post.count({
          where: {
            OR: [
              {
                content: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                users: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              },
              {
                users: {
                  firstName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              },
              {
                users: {
                  lastName: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                }
              }
            ]
          }
        })
      ]);

      results.posts = posts.map(post => ({
        ...post,
        author: post.users, // Map users relation to author for frontend compatibility
        excerpt: post.content ? 
          post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '') : 
          '',
        commentsCount: post._count.Comment,
        votesCount: 0 // We'll add vote counting later if needed
      }));
      results.totalPosts = postsCount;
    }

    // Search Members
    if (type === 'all' || type === 'members') {
      const [members, membersCount] = await Promise.all([
        prisma.users.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                headline: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                profession: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                company: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                bio: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            headline: true,
            profession: true,
            company: true,
            bio: true,
            location: true,
            city: true,
            country: true,
            skills: true,
            createdAt: true,
            lastActiveAt: true,
            isVerified: true,
            _count: {
              select: {
                Post: true,
                Comment: true
              }
            }
          },
          orderBy: [
            {
              isVerified: 'desc'
            },
            {
              lastActiveAt: 'desc'
            },
            {
              createdAt: 'desc'
            }
          ],
          take: type === 'members' ? limit : Math.min(limit, 10),
          skip: type === 'members' ? offset : 0
        }),
        prisma.users.count({
          where: {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                headline: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                profession: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                company: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                bio: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        })
      ]);

      results.members = members.map(member => ({
        ...member,
        fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name,
        location: `${member.city || ''} ${member.country || ''}`.trim() || member.location,
        postsCount: member._count.Post,
        commentsCount: member._count.Comment,
        rank: 'NEW_MEMBER' // Default rank since rank field doesn't exist
      }));
      results.totalMembers = membersCount;
    }

    // Calculate total pages
    if (type === 'posts') {
      results.totalPages = Math.ceil(results.totalPosts / limit);
    } else if (type === 'members') {
      results.totalPages = Math.ceil(results.totalMembers / limit);
    } else {
      results.totalPages = Math.ceil(Math.max(results.totalPosts, results.totalMembers) / limit);
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}