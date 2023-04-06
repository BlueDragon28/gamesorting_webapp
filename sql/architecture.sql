-- USE gamesorting_webapp;
-- This table hold the list of collections, a collection hold one or many list inside.
-- Each collections is based on a specific subject (ex: games, books, etc)
DROP TABLE IF EXISTS collections;

CREATE TABLE IF NOT EXISTS collections(
    CollectionID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT NOT NULL, -- A pointer to the user
    Name VARCHAR(300) NOT NULL -- The name of the collection
);

-- This table hold the list of all the lists of all collections.
-- A list hold items of a specific section of a collection (ex: readed books, wanted books, etc)
DROP TABLE IF EXISTS lists;

CREATE TABLE IF NOT EXISTS lists(
    ListID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    CollectionID BIGINT UNSIGNED NOT NULL, -- To which collection the list linked.
    Name VARCHAR(300) NOT NULL -- The name of the list
);

-- This table hold the user defined rows in their list
DROP TABLE IF EXISTS listColumnsType;

CREATE TABLE IF NOT EXISTS listColumnsType(
    ListColumnTypeID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ListID BIGINT UNSIGNED NOT NULL,
    Name VARCHAR(300) NOT NULL, -- The name of the custom row
    Type JSON NOT NULL
    CHECK (JSON_VALID(Type))
);

-- This table hold the items of each lists
DROP TABLE IF EXISTS items;

CREATE TABLE IF NOT EXISTS items(
    ItemID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ListID BIGINT UNSIGNED NOT NULL, -- To wich list the item is own
    Name VARCHAR(300) NOT NULL, -- The name of the item
    URL VARCHAR(10000),
    Rating TINYINT UNSIGNED DEFAULT 0
);

-- This table hold the values of each custom rows of each items
DROP TABLE IF EXISTS customRowsItems;

CREATE TABLE IF NOT EXISTS customRowsItems(
    CustomRowItemsID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ItemID BIGINT UNSIGNED NOT NULL, -- To wich list item this custom items is linked to
    ListColumnTypeID BIGINT UNSIGNED NOT NULL, -- To wich list custom rows this custom items in linked to.
    Value VARCHAR(300) NOT NULL -- The name of the custom item
);

-- This table hold the users of the app
-- Each users is represented by its username, email and hashed password
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users(
    UserID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(300) NOT NULL,
    Email VARCHAR(300) NOT NULL,
    Password VARCHAR(10000) NOT NULL,
    BypassRestriction BOOLEAN NOT NULL DEFAULT FALSE
);

-- This table hold the token for the password lost interface
DROP TABLE IF EXISTS usersLostPassword;

CREATE TABLE IF NOT EXISTS usersLostPassword(
    UserLostID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    UserID BIGINT UNSIGNED NOT NULL,
    Token VARCHAR(3000) NOT NULL,
    Time BIGINT UNSIGNED NOT NULL
);
