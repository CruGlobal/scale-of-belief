require('dotenv').config()

module.exports = {
  development: {
    dialect: 'postgres',
    username: process.env.DB_ENV_POSTGRESQL_USER,
    password: process.env.DB_ENV_POSTGRESQL_PASS,
    database: process.env.DB_ENV_POSTGRESQL_DB,
    host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
    port: process.env.DB_PORT_5432_TCP_PORT || 5432
  },
  test: {
    dialect: 'postgres',
    username: process.env.DB_ENV_POSTGRESQL_USER,
    password: process.env.DB_ENV_POSTGRESQL_PASS,
    database: `${process.env.DB_ENV_POSTGRESQL_DB}_test`,
    host: process.env.DB_PORT_5432_TCP_ADDR || 'localhost',
    port: process.env.DB_PORT_5432_TCP_PORT || 5432,
    logging: false
  }
}
