USE gamesorting_webapp;

-- This table hold the list of all the lists (game list, books list, etc)
DROP TABLE IF EXISTS lists;

CREATE TABLE IF NOT EXISTS lists(
    ListID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(300) NOT NULL -- The name of the list
);

-- This table hold the user defined rows in their list
DROP TABLE IF EXISTS listRowsType;

CREATE TABLE IF NOT EXISTS listRowsType(
    ListRowsTypeID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
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
    CustomRowsItemsID BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    ItemID BIGINT UNSIGNED NOT NULL, -- To wich list item this custom items is linked to
    ListRowsTypeID BIGINT UNSIGNED NOT NULL, -- To wich list custom rows this custom items in linked to.
    Name VARCHAR(300) NOT NULL -- The name of the custom item
);