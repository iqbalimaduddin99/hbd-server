require('dotenv').config();
module.exports = {
"development": {
    "username": process.env.usernamePostgre,
    "password": process.env.password,
    "database": process.env.database,
    "host": process.env.host,
    "port": process.env.portPostgre,
    "dialect": "postgres"
},
"test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "postgres"
},
"production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "postgres"
}
};