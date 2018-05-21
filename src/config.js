module.exports = {
    database_name: "hasuradb",
    realm_object_server_url: process.env.REALM_URL,
    auth_server_url: process.env.REALM_AUTH_URL,
    admin_username: process.env.REALM_USER,
    admin_password: process.env.REALM_PASSWORD,
    common_realm_path: '/common',
    realm_path: '/tables',
    postgres_config: {
        host:     process.env.ENV === 'DEV' ? 'localhost' : 'postgres.hasura',
        port:     5432,
        user:     process.env.PG_USER,
        password: process.env.PG_PASSWORD
    },
}
