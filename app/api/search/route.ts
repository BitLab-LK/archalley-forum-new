import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchPosts, cleanText, getFeaturedImageUrl, getPostCategory } from '@/lib/wordpress-api';
import type { WordPressPost } from '@/lib/wordpress-api';

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

    // Search Posts (Database + WordPress)
    if (type === 'all' || type === 'posts') {
      // Search database posts and WordPress posts in parallel
      const [posts, postsCount, wordpressResult] = await Promise.all([
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
        }),
        // Search WordPress posts
        searchPosts(searchTerm, page, type === 'posts' ? limit : Math.min(limit, 10)).catch(error => {
          console.error('WordPress search error:', error);
          return [];
        })
      ]);

      const wordpressPosts = wordpressResult || [];

      // Transform database posts
      const dbPosts = posts.map(post => ({
        ...post,
        author: post.users, // Map users relation to author for frontend compatibility
        excerpt: post.content ? 
          post.content.substring(0, 200) + (post.content.length > 200 ? '...' : '') : 
          '',
        commentsCount: post._count.Comment,
        votesCount: 0, // We'll add vote counting later if needed
        isWordPress: false,
        images: [] // Database posts don't have images array yet
      }));

      // Transform WordPress posts to match SearchPost interface
      const wpPosts = wordpressPosts.map((wpPost: WordPressPost) => {
        const category = getPostCategory(wpPost);
        const featuredImage = getFeaturedImageUrl(wpPost, 'medium');
        const excerpt = cleanText(wpPost.excerpt.rendered);
        const content = cleanText(wpPost.content.rendered);
        const title = cleanText(wpPost.title.rendered);
        
        // Extract categories from embedded terms
        const categories = wpPost._embedded?.['wp:term']?.[0]?.filter(term => term.taxonomy === 'category') || [];
        
        return {
          id: `wp-${wpPost.id}`, // Prefix to distinguish from DB posts
          content: title, // Use title as the main content (displayed as heading)
          excerpt: excerpt || content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          createdAt: wpPost.date,
          updatedAt: wpPost.date,
          author: {
            id: 'wordpress',
            name: 'ArchAlley',
            image: null,
            headline: null
          },
          categories: category ? {
            id: categories[0]?.id?.toString() || '0',
            name: category.name,
            color: null
          } : null,
          allCategories: categories.map(cat => ({
            id: cat.id.toString(),
            name: cat.name,
            color: null,
            slug: cat.slug
          })),
          images: featuredImage !== '/placeholder-blog.jpg' ? [featuredImage] : [],
          commentsCount: 0, // WordPress posts don't have comments in our DB
          votesCount: 0,
          isWordPress: true,
          wordpressSlug: wpPost.slug,
          wordpressLink: wpPost.link
        };
      });

      // Combine and sort posts (WordPress posts first, then database posts)
      // In "all" mode, limit WordPress posts to maintain balance
      const wpPostsToInclude = type === 'posts' 
        ? wpPosts 
        : wpPosts.slice(0, Math.min(limit, 10));
      
      results.posts = [...wpPostsToInclude, ...dbPosts];
      
      // Combine WordPress and database post totals
      // WordPress API doesn't provide total count, so we estimate based on returned results
      // If we got a full page of results, assume there might be more
      const estimatedWordPressTotal = wordpressPosts.length >= limit ? wordpressPosts.length * 2 : wordpressPosts.length;
      results.totalPosts = postsCount + estimatedWordPressTotal;
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