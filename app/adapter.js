const Realm = require('realm');
const fs = require('fs');
const path = require('path');
const PostgresAdapter = require('realm-postgres-adapters').PostgresAdapter;
const Config = require('./config');

var adapter = null

async function start(schemaModels, shouldResetReplicationSlot) {
  var admin_user = await Realm.Sync.User.login(Config.auth_server_url, Config.admin_username, Config.admin_password)
  process.on('uncaughtException', (err) => {
    console.log('uncaughtException')
    console.log(err)
  });

  //If adapter exists, shut it down and restart
  if (adapter !== null) {
    adapter.shutdown()
  }
  adapter = new PostgresAdapter({
      // Realm configuration parameters for connecting to ROS
      realmConfig: {
          server: Config.realm_object_server_url, // or specify your realm-object-server location
          user:   admin_user,
      },
      dbName: Config.database_name,
      // Postgres configuration and database name
      postgresConfig: Config.postgres_config,
      resetPostgresReplicationSlot: shouldResetReplicationSlot,
      // Set to true to create the Postgres DB if not already created
      createPostgresDB: false,
      initializeRealmFromPostgres: true,
      // Set to true to indicate Postgres tables should be created and
      // properties added to these tables based on schema additions
      // made in Realm. If set to false any desired changes to the
      // Postgres schema will need to be made external to the adapter.
      applyRealmSchemaChangesToPostgres: false,

      // The regex to match for realm path
      realmRegex: `/(.*?)${Config.realm_path}`,

      // Specify the RealmPath a Postgres change should be applied to
      mapPostgresChangeToRealmPath: (tableName, props) => {
        //Ideally the realm path which hosts all the TP tables
        console.log(`PG CHANGE -> ${tableName}`)
        console.log(`${JSON.stringify(props)}`)
        if (props.realm_id) {
          return `/${props.realm_id}${Config.realm_path}`
        }
        return Config.common_realm_path
      },

      // Specify the Realm objects we want to replicate in Postgres.
      // Any types or properties not specified here will not be replicated
      schema: schemaModels,

      mapRealmChangeToPostgresTable: (realmPath) => {
        console.log(`Realm change in path: ${realmPath}`)
        return {}
      },

      printCommandsToConsole: false,
  });
}

module.exports = {
  start
}
