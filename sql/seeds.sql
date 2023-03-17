-- USE gamesorting_webapp;

-- Insert data into collections table
DELETE FROM collections;

INSERT INTO collections(CollectionID, UserID, Name)
VALUES
    (1, 2, "Games"),
    (2, 2, "Books"),
    (3, 2, "Movies");

-- Insert data into the lists table
DELETE FROM lists;

INSERT INTO lists(ListID, CollectionID, Name)
VALUES
    (1, 1, "Played Games"), (2, 2, "Readed Books"), (3, 3, "Watched Movies");

-- Insert data into items list
DELETE FROM items;

INSERT INTO items(ItemID, ListID, Name)
VALUES
    (1, 1, "Battlefield 4"),
    (2, 1, "SnowRunner"),

    (3, 2, "DragonSpell"),
    (4, 2, "Raisin Dragons"),

    (5, 3, "Frozen II"),
    (6, 3, "Raya and the Last Dragon"),
    (7, 3, "The Passion of the Christ");

-- Insert data into listRowsType
DELETE FROM listColumnsType;

INSERT INTO listColumnsType(ListColumnTypeID, ListID, Name, Type)
VALUES
    (1, 1, "Categories", '{"type": "@String"}'),

    (2, 2, "Authors", '{"type": "@String"}'),

    (3, 3, "Productor", '{"type": "@String"}'),

    (4, 1, "ReleaseYear", '{"type": "@Int","min":1900,"max":2600}');

-- Insert data into customRowsItems
DELETE FROM customRowsItems;

INSERT INTO customRowsItems(CustomRowItemsID, ItemID, ListColumnTypeID, Value)
VALUES
    (1, 1, 1, "Action"),
    (2, 2, 1, "Trucks"),

    (3, 3, 2, "Fantasy"),
    (4, 4, 2, "Fantasy"),

    (5, 5, 3, "Disney"),
    (6, 6, 3, "Disney"),
    (7, 7, 3, "Mel Gibson");

DELETE FROM users;

INSERT INTO users(UserID, Username, Email, Password)
VALUES
    (1, "Some user", "some@email.com", "$2a$12$bNG5j/sssJaBmlY21hpChOq.pc5q0A18Byj0jclPt4JgRDtdTWIf."),
    (2, "BlueDragon28", "dragon@sisu.com", "$2a$12$dyYOCKe0BHbk4Xl/lGuztuthifqdPIMOX93P1wXOeO7hQ32/1eSTi");


DELETE FROM usersLostPassword;
