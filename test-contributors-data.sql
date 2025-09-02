-- Test script to verify top contributors data
-- This will help ensure we have sample data to test with

-- Insert some sample users if they don't exist
INSERT INTO users (id, name, email, "image", role, "isVerified", "createdAt", "updatedAt", "lastActiveAt")
VALUES 
  ('user1', 'John Doe', 'john@example.com', '/placeholder.svg', 'MEMBER', true, NOW(), NOW(), NOW()),
  ('user2', 'Jane Smith', 'jane@example.com', '/placeholder.svg', 'MEMBER', true, NOW(), NOW(), NOW()),
  ('user3', 'Mike Johnson', 'mike@example.com', '/placeholder.svg', 'MEMBER', false, NOW(), NOW(), NOW()),
  ('user4', 'Sarah Chen', 'sarah@example.com', '/placeholder.svg', 'MEMBER', true, NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert sample categories if they don't exist
INSERT INTO categories (id, name, description, color, icon, slug, "postCount", "createdAt", "updatedAt")
VALUES 
  ('cat1', 'General', 'General discussions', '#6B7280', '💬', 'general', 0, NOW(), NOW()),
  ('cat2', 'Tech', 'Technology discussions', '#3B82F6', '💻', 'tech', 0, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert sample posts
INSERT INTO "Post" (id, content, "authorId", "categoryId", "createdAt", "updatedAt")
VALUES 
  ('post1', 'First post by John', 'user1', 'cat1', NOW(), NOW()),
  ('post2', 'Second post by John', 'user1', 'cat1', NOW() - INTERVAL '1 day', NOW()),
  ('post3', 'Post by Jane', 'user2', 'cat2', NOW() - INTERVAL '2 days', NOW()),
  ('post4', 'Another post by Jane', 'user2', 'cat1', NOW() - INTERVAL '3 days', NOW()),
  ('post5', 'Mike''s post', 'user3', 'cat2', NOW() - INTERVAL '4 days', NOW()),
  ('post6', 'Sarah''s post', 'user4', 'cat1', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO "Comment" (id, content, "postId", "authorId", "createdAt", "updatedAt")
VALUES 
  ('comment1', 'Great post!', 'post1', 'user2', NOW(), NOW()),
  ('comment2', 'Thanks for sharing', 'post2', 'user3', NOW(), NOW()),
  ('comment3', 'Interesting perspective', 'post3', 'user1', NOW(), NOW()),
  ('comment4', 'I agree', 'post4', 'user4', NOW(), NOW()),
  ('comment5', 'Nice work', 'post5', 'user2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample votes
INSERT INTO votes (id, type, "userId", "postId", "createdAt")
VALUES 
  ('vote1', 'UP', 'user2', 'post1', NOW()),
  ('vote2', 'UP', 'user3', 'post1', NOW()),
  ('vote3', 'UP', 'user4', 'post1', NOW()),
  ('vote4', 'UP', 'user1', 'post3', NOW()),
  ('vote5', 'UP', 'user4', 'post3', NOW()),
  ('vote6', 'UP', 'user1', 'post6', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample comment votes
INSERT INTO votes (id, type, "userId", "commentId", "createdAt")
VALUES 
  ('cvote1', 'UP', 'user1', 'comment1', NOW()),
  ('cvote2', 'UP', 'user4', 'comment1', NOW()),
  ('cvote3', 'UP', 'user2', 'comment3', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample badges
INSERT INTO badges (id, name, description, icon, color, type, level, criteria, "createdAt", "updatedAt")
VALUES 
  ('badge1', 'First Post', 'Created your first post', '🎉', '#10B981', 'ACTIVITY', 'BRONZE', '{"postsCount": 1}', NOW(), NOW()),
  ('badge2', 'Active Contributor', 'Made 10 posts', '⭐', '#F59E0B', 'ACTIVITY', 'SILVER', '{"postsCount": 10}', NOW(), NOW()),
  ('badge3', 'Community Helper', 'Helped others with comments', '🤝', '#8B5CF6', 'ENGAGEMENT', 'BRONZE', '{"commentsCount": 5}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Award some badges to users
INSERT INTO "userBadges" (id, "userId", "badgeId", "earnedAt")
VALUES 
  ('ub1', 'user1', 'badge1', NOW()),
  ('ub2', 'user1', 'badge2', NOW()),
  ('ub3', 'user2', 'badge1', NOW()),
  ('ub4', 'user2', 'badge3', NOW()),
  ('ub5', 'user4', 'badge1', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Sample data inserted successfully' as result;
