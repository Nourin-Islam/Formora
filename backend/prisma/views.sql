
-- model FormSubmissionView {
--   form_id        Int       @map("form_id")
--   templateId     Int
--   user_id        Int       @map("user_id")
--   user_name      String    @map("user_name")
--   submission_date DateTime @map("submission_date")
--   question_id    Int       @map("question_id")
--   question_title String    @map("question_title")
--   question_type  String    @map("question_type") // Or use an enum if you have fixed types
--   show_in_table  Boolean   @map("show_in_table")
--   answer         String

--   @@id([form_id, question_id])
--   @@map("form_submissions_view")
-- }

-- View Related Info

-- await prisma.$executeRaw`REFRESH MATERIALIZED VIEW template_search_joined_view`;
-- await prisma.$executeRaw`REFRESH MATERIALIZED VIEW template_search_view`;


-- create view
--  CREATE OR REPLACE VIEW template_search_view AS
-- SELECT 
--   t.id,
--   t.title,
--   t.description,
--   t."imageUrl",
--   t."isPublic",
--   t."isPublished",
--   t."likesCount",
--   t."createdAt",
--   t."updatedAt",
--   t."userId",
--   t."topicId",
--   jsonb_build_object(
--     'id', u.id,
--     'name', u.name,
--     'email', u.email,
--     'clerkId', u."clerkId"
--   ) AS user,
--   jsonb_build_object(
--     'id', tp.id,
--     'name', tp.name
--   ) AS topic,
--   (
--     SELECT jsonb_agg(jsonb_build_object(
--       'id', tag.id,
--       'name', tag.name,
--       'usageCount', tag."usageCount"
--     ))
--     FROM "TemplateTag" tt
--     JOIN "Tag" tag ON tag.id = tt."tagId"
--     WHERE tt."templateId" = t.id
--   ) AS tags,
--   (
--     SELECT jsonb_agg(u_liked."clerkId")
--     FROM "Like" l
--     JOIN "User" u_liked ON u_liked.id = l."userId"
--     WHERE l."templateId" = t.id
--   ) AS "peopleLiked",
--   (
--     SELECT COUNT(*) 
--     FROM "Comment" c 
--     WHERE c."templateId" = t.id
--   ) AS "commentsCount",
--   (
--     SELECT COUNT(*) 
--     FROM "Question" q 
--     WHERE q."templateId" = t.id
--   ) AS "questionsCount"
-- FROM "Template" t
-- JOIN "User" u ON u.id = t."userId"
-- JOIN "Topic" tp ON tp.id = t."topicId";


-- FROM "Template" t;


-- add giin

-- CREATE INDEX idx_template_search_vector 
-- ON template_search_view 
-- USING GIN (search_vector);



-- create joined view

--  CREATE MATERIALIZED VIEW template_search_joined_view AS
-- SELECT 
--   t.id,
--   t.title,
--   t.description,
--   t."imageUrl",
--   t."isPublic",
--   t."isPublished",
--   t."likesCount",
--   t."createdAt",
--   t."updatedAt",
--   json_build_object(
--     'id', u.id,
--     'clerkId', u."clerkId",
--     'name', u.name,
--     'email', u.email
--   ) AS "user",
--   json_build_object(
--     'id', top.id,
--     'name', top.name,
--     'createdAt', top."createdAt"
--   ) AS "topic",
--   (
--     SELECT json_agg(json_build_object(
--       'id', tag.id,
--       'name', tag.name,
--       'usageCount', tag."usageCount",
--       'createdAt', tag."createdAt"
--     ))
--     FROM "TemplateTag" tt
--     JOIN "Tag" tag ON tag.id = tt."tagId"
--     WHERE tt."templateId" = t.id
--   ) AS "tags",
--   (
--     SELECT json_agg(u."clerkId")
--     FROM "Like" l
--     JOIN "User" u ON u.id = l."userId"
--     WHERE l."templateId" = t.id
--   ) AS "peopleLiked",
--   (
--     SELECT COUNT(*) FROM "Question" q WHERE q."templateId" = t.id
--   ) AS "questionCount",
--   (
--     SELECT COUNT(*) FROM "Comment" c WHERE c."templateId" = t.id
--   ) AS "commentCount",
--   to_tsvector('english', 
--     coalesce(t.title, '') || ' ' || 
--     coalesce(t.description, '') || ' ' || 
--     coalesce(top.name, '')
--   ) AS search_vector
-- FROM "Template" t
-- JOIN "User" u ON u.id = t."userId"
-- JOIN "Topic" top ON top.id = t."topicId";



-- add giin

-- CREATE INDEX idx_template_join_search_vector ON template_search_joined_view USING GIN (search_vector);
-- CREATE UNIQUE INDEX idx_template_search_joined_view_id ON template_search_joined_view (id);


-- remove giin 

-- DROP INDEX IF EXISTS idx_template_join_search_vector;
-- DROP INDEX IF EXISTS idx_template_search_joined_view_id;

-- DROP MATERIALIZED VIEW IF EXISTS template_search_joined_view;


-- DROP MATERIALIZED 

-- CREATE OR REPLACE VIEW popular_templates_view AS
-- SELECT 
--   ts.*,
--   COALESCE(f.count, 0) AS "submissionCount"
-- FROM template_search_view ts
-- LEFT JOIN (
--   SELECT "templateId", COUNT(*) AS count
--   FROM "Form"
--   GROUP BY "templateId"
-- ) f ON ts.id = f."templateId"
-- ORDER BY f.count DESC;