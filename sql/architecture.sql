USE gamesorting_webapp;

-- This table hold the list of collections, a collection hold one or many list inside.
-- Each collections is based on a specific subject (ex: games, books, etc)
DROP TABLE IF EXISTS collections;

CREATE TABLE IF NOT EXISTS collections(
    CollectionID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
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
DROP TABLE IF EXISTS listRowsType;

CREATE TABLE IF NOT EXISTS listRowsType(
    ListRowTypeID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ListID BIGINT UNSIGNED NOT NULL,
    Name VARCHAR(300) NOT NULL, -- The name of the custom row
    Type VARCHAR(300) NOT NULL, -- The type of the custom row
    Position TINYINT UNSIGNED NOT NULL -- The position of the custom row
);

-- This table hold the items of each lists
DROP TABLE IF EXISTS items;

CREATE TABLE IF NOT EXISTS items(
    ItemID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ListID BIGINT UNSIGNED NOT NULL, -- To wich list the item is own
    Name VARCHAR(300) NOT NULL, -- The name of the item
    URL VARCHAR(10000)
);

-- This table hold the values of each custom rows of each items
DROP TABLE IF EXISTS customRowsItems;

CREATE TABLE IF NOT EXISTS customRowsItems(
    CustomRowItemsID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ItemID BIGINT UNSIGNED NOT NULL, -- To wich list item this custom items is linked to
    ListRowTypeID BIGINT UNSIGNED NOT NULL, -- To wich list custom rows this custom items in linked to.
    Value VARCHAR(300) NOT NULL -- The name of the custom item
);