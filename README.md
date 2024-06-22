# GameSorting Web App

This is a simple web application to make list of wishes and sort them.

The data are divided into two section: the _Collections/Lists_ and the _Items_. The former represents the theme, like: _books/ideas_, and the latter is the elements themselves.

One of the best feature of the app is the ability to add customs data. You add a custom column to a whole list, and after that, a custom input will be available in the new/edit page for each item of the list. You can also add custom data per item.

I hope you will like this application.

## Usage

Clone the repository:

```Bash
git clone git@github.com:BlueDragon28/gamesorting_webapp.git
```

If you want to have a stable version of the app, move to the _prepareProduction_ branch or select a specific tag.

Then, install the dependencies:

```Bash
npm install --save-prod
```

In a subdirectory, create .env file and add this data to it. Change them based on your needs.

```env
DOMAINE_NAME="http://localhost:8080"
SESSION_SECRET_KEY="developmentonlysecret"
SECURE_SESSION_COOKIE="false"

MARIADB_USER="yourUserName"
MARIADB_PASSWORD="yourAccountPassword"
MARIADB_DATABASE_NAME="gamesorting_webapp"
MARIADB_CONNECTION_LIMIT=5

LISTENING_PORT=8080
```

If you want to use unix socket instead of password connection, use:

```env
MARIADB_SOCKET_PATH="/path/to/mariadb/socket/path"
```

Then run the app using:

```Bash
ENV_VAR_FILE="/path/to/.env/file" npm run prod
```

Enjoy.

## License

The application is licensed under the [MIT license](LICENSE)
