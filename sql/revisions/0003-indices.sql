-- This revision is made to add indeces to the tables of the application.

CREATE INDEX UsersIndices ON users(Username, Email);

CREATE INDEX CollectionsIndices ON collections(UserID, Name);

CREATE INDEX ListsIndices ON lists(CollectionID, Name);

CREATE INDEX ListColumnTypeIndices ON listColumnsType(ListID, Name);

CREATE INDEX ItemsIndices ON items(ListID, Name);

CREATE INDEX CustomRowsItemsIndices ON customRowsItems(ItemID);
