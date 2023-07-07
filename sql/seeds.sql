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
    (1, 1, "Game 1"),
    (2, 1, "Game 2"),

    (3, 2, "Book 1"),
    (4, 2, "Book 2"),

    (5, 3, "Movie 1"),
    (6, 3, "Movie 2"),
    (7, 3, "Movie 3");

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
    (1, 1, 1, "Categories 1"),
    (2, 2, 1, "Categories 2"),

    (3, 3, 2, "Author 1"),
    (4, 4, 2, "Author 2"),

    (5, 5, 3, "Productor 1"),
    (6, 6, 3, "Productor 2"),
    (7, 7, 3, "Productor 3");

DELETE FROM users;

INSERT INTO users(UserID, Username, Email, Password)
VALUES
    (1, "Some user", "some@email.com", "$2a$12$shkfCBthDbpxTRmK2AhPA.KUdm0wHJ7BT1RteDxCh5JDy00SWbaOS"),
    (2, "BlueDragon28", "email@prodiver.com", "$2a$12$shkfCBthDbpxTRmK2AhPA.KUdm0wHJ7BT1RteDxCh5JDy00SWbaOS");


DELETE FROM usersLostPassword;
DELETE FROM userActivity;
DELETE FROM listSorting;
