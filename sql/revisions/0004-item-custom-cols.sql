-- This table is used to store custom columns that are
-- specific to only one item.

CREATE TABLE IF NOT EXISTS itemCustomCols(
    ItemID BIGINT UNSIGNED UNIQUE NOT NULL PRIMARY KEY,
    data JSON NOT NULL,
    CONSTRAINT item_foreign_key
        FOREIGN KEY (ItemID) REFERENCES items (ItemID)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,
    CHECK (JSON_VALID(data))
);