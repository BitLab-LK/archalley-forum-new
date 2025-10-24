-- CreateIndex
CREATE INDEX "Post_isHidden_moderationStatus_idx" ON "Post"("isHidden", "moderationStatus");

-- CreateIndex
CREATE INDEX "Post_isPinned_createdAt_idx" ON "Post"("isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_viewCount_idx" ON "Post"("viewCount");

-- CreateIndex
CREATE INDEX "votes_postId_type_idx" ON "votes"("postId", "type");

-- CreateIndex
CREATE INDEX "votes_commentId_type_idx" ON "votes"("commentId", "type");

-- CreateIndex
CREATE INDEX "votes_postId_idx" ON "votes"("postId");

-- CreateIndex
CREATE INDEX "votes_commentId_idx" ON "votes"("commentId");

-- CreateIndex
CREATE INDEX "votes_type_idx" ON "votes"("type");
