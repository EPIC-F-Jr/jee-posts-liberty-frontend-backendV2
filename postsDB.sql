-- ======================================================
-- USERS TABLE
-- ======================================================
CREATE TABLE
    users (
        id VARCHAR(36) NOT NULL PRIMARY KEY, -- UUID or custom string ID
        username VARCHAR(255) NOT NULL UNIQUE, -- unique constraint on username
        is_active BOOLEAN NOT NULL DEFAULT TRUE, -- soft-delete flag
        created_at DATETIME NULL, -- creation timestamp
        updated_at DATETIME NULL -- last update timestamp
    );

-- ======================================================
-- POSTS TABLE
-- ======================================================
CREATE TABLE
    posts (
        id VARCHAR(36) NOT NULL PRIMARY KEY, -- UUID or custom string ID
        user_id VARCHAR(36) NOT NULL, -- FK -> users.id
        title VARCHAR(255) NOT NULL, -- post title
        content TEXT NULL, -- post body
        created_at DATETIME NULL, -- creation timestamp
        updated_at DATETIME NULL, -- last update timestamp
        is_active BOOLEAN NOT NULL DEFAULT TRUE, -- soft-delete flag
        CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users (id)
    );

-- ======================================================
-- LIKES TABLE
-- ======================================================
CREATE TABLE
    likes (
        id BIGINT AUTO_INCREMENT PRIMARY KEY, -- auto-generated PK
        user_id VARCHAR(36) NOT NULL, -- FK -> users.id
        target_id VARCHAR(36) NOT NULL, -- ID of post/comment/etc.
        target_type VARCHAR(50) NOT NULL, -- type discriminator (e.g., 'post', 'comment')
        is_active BOOLEAN NOT NULL DEFAULT TRUE, -- soft-delete flag
        created_at DATETIME NOT NULL, -- creation timestamp
        updated_at DATETIME NOT NULL, -- last update timestamp
        CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id)
    );

-- ======================================================
-- COMMENTS TABLE
-- ======================================================
CREATE TABLE
    comments (
        id VARCHAR(36) NOT NULL PRIMARY KEY, -- UUID or custom string ID
        user_id VARCHAR(36) NOT NULL, -- FK -> users.id
        post_id VARCHAR(36) NOT NULL, -- FK -> posts.id
        content VARCHAR(1000) NOT NULL, -- comment text
        is_active BOOLEAN NOT NULL DEFAULT TRUE, -- soft-delete flag
        created_at DATETIME NOT NULL, -- creation timestamp
        updated_at DATETIME NOT NULL, -- last update timestamp
        CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id)
    );