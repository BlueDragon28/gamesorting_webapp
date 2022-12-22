USE gamesorting_webapp;

-- Insert data into the lists table
DELETE FROM lists;

INSERT INTO lists(ListID, Name)
VALUES
    (1, "Games"), (2, "Books"), (3, "Movies");

-- Insert data into items list
DELETE FROM items;

INSERT INTO items(ItemID, ListID, Name)
VALUES
    (1, 1, "Battlefield 4"),
    (2, 1, "SnowRunner"),

    (3, 2, "DragonSpell"),
    (4, 2, "The Hero's Lot"),

    (5, 3, "Frozen II"),
    (6, 3, "Raya and the Last Dragon"),
    (7, 3, "The Passion of the Christ");

-- Insert data into listRowsType
DELETE FROM listRowsType;

INSERT INTO listRowsType(ListRowTypeID, ListID, Name, Type, Position)
VALUES
    (1, 1, "Categories", "@String", 0),

    (2, 2, "Authors", "@String", 0),

    (3, 3, "Productor", "@String", 0);

-- Insert data into customRowsItems
DELETE FROM customRowsItems;

INSERT INTO customRowsItems(CustomRowItemsID, ItemID, ListRowTypeID, Value)
VALUES
    (1, 1, 1, "Action"),
    (2, 2, 1, "Trucks"),

    (3, 3, 2, "Fantasy"),
    (4, 4, 2, "Fantasy"),

    (5, 5, 3, "Disney"),
    (6, 6, 3, "Disney"),
    (7, 7, 3, "Mel Gibson");