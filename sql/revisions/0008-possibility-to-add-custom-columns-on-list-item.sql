ALTER TABLE 
  listColumnsType
ADD COLUMN 
  onListItem ENUM(
    "no",
    "on-title",
    "under-item"
  ) DEFAULT "no";
