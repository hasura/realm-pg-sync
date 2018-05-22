const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const app = express();

const syncAdapter = require('./adapter')
const utils = require('./utils')

const fetch = require('node-fetch')

const Config = require('./config');

const serverState = {
  retryCount: 0,
  trackedTables: [],
  realmSchemaArr: [],
  pgSchemaArr: [],
  logs: []
}

function log(log) {
  console.log(log)
  //clear more than 100 entries
  if (serverState.logs.length > 100) {
    serverState.logs.splice(0, 1)
  }
  serverState.logs.push({
    message: log,
    time: new Date()
  })
}

async function startAdapter(shouldResetReplicationSlot) {
  log('Starting adapter')
  try {
    //Fetch list of table names
    tableNames = await utils.fetchTablesToTrack()
    //Fetch schema for each table
    pgSchemaArr = await utils.fetchPgSchema(tableNames)
    //Convert from pg schema to realm schema
    realmSchemaArr = pgSchemaArr.map(utils.convertPgToRealmSchema)
    if (realmSchemaArr.length === 0) {
      log('No Tables to sync. Waiting until table added to track')
      return
    }

    log(`Realm Schemas being tracked: ${JSON.stringify(realmSchemaArr)}`)
    syncAdapter.start(realmSchemaArr, shouldResetReplicationSlot)

    serverState.trackedTables = tableNames
    serverState.pgSchemaArr = pgSchemaArr
    serverState.realmSchemaArr = realmSchemaArr
    serverState.retryCount = 0
    log('Adapter Syncing')
  } catch (error) {
    log(`Could not start adapter. ${error}`)
    const retryTime = (2^serverState.retryCount) * 100
    log(`Re-trying in ${retryTime} ms`)
    setTimeout(() => {
      startAdapter(shouldResetReplicationSlot)
    }, retryTime)
    serverState.retryCount += 1
  }
}

startAdapter()

app.use(express.static(path.join(__dirname, 'build')));

app.get('/ping', function (req, res) {
 return res.send('pong');
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use(bodyParser.json());

app.get('/all_tables', async (req, res) => {
  try {
    const tableNames = await utils.fetchAllTablesNamesFromPG()
    res.json(tableNames)
  } catch(error) {
    log(`Failed to fetch all table names. ${error}`)
    res.status(500).json({error: 'Unable to fetch all tables'})
  }
})

app.get('/tracked_tables', async (req, res) => {
  try {
    const trackedTables = await utils.fetchTablesToTrack()
    const tableSchamas = await utils.fetchPgSchema(trackedTables)
    const responseJSON = tableSchamas.map((schema) => {
      let containsRealmId = false
      schema.columns.forEach((col) => {
        if (col.column_name === 'realm_id') {
          containsRealmId = true
        }
      })
      return {
        name: schema.table_name,
        realm_path: containsRealmId ? `/~${Config.realm_path}` : Config.common_realm_path
      }
    })
    res.json(responseJSON)
  } catch(error) {
    log(`Failed to fetch tracked tables. ${error}`)
    res.status(500).json({error: 'Unable to fetch tracked tables'})
  }
})

app.post('/re_track_tables', async (req, res) => {
  const tableNames = req.body.table_names
  log(`Trying to retrack tables: ${tableNames.toString()}`)
  try {
    var schemaArr = await utils.fetchPgSchema(tableNames)
    if (schemaArr.length !== tableNames.length) {
      log(`Tracking tables ${tableNames.toString()} failed. Does not exist in Postgres`)
      res.status(403).json({error: 'All tables do not exist in Postgres'})
      return
    }
    try {
      const response = await utils.retrackAllTables(tableNames)
      log(`Successfully tracked tables: ${tableNames.toString()}`)
      startAdapter()
      res.json({message: 'Successful'})
    } catch (trackError) {
      log(`Retracking tables ${tableNames.toString()} failed. ${trackError}`)
      res.status(403).json(trackError)
      return
    }
  } catch(e) {
    log(`Retracking tables ${tableNames.toString()} failed. Fetching schema failed. ${e.toString()}`)
    res.status(500).json(e)
  }
})

//expects ['TableA', 'TableB'....] => list of table names to track
app.post('/track_tables', async (req, res) => {
  const tableNames = req.body.table_names
  log(`Trying to track tables: ${tableNames.toString()}`)
  try {
    var schemaArr = await utils.fetchPgSchema(tableNames)
    if (schemaArr.length !== tableNames.length) {
      log(`Tracking tables ${tableNames.toString()} failed. Does not exist in Postgres`)
      res.status(403).json({error: 'All tables do not exist in Postgres'})
      return
    }
    try {
      const response = await utils.trackTables(tableName)
      log(`Successfully tracked tables: ${tableNames.toString()}`)
    } catch (trackError) {
      log(`Tracking tables ${tableNames.toString()} failed. ${trackError.error}`)
      res.status(403).json(trackError)
      return
    }
    startAdapter()
    res.json({message: 'Successful'})
  } catch(e) {
    log(`Tracking tables ${tableNames.toString()} failed. ${e.toString()}`)
    res.status(500).json(e)
  }
})

//expects ['TableA', 'TableB'....] => list of table names to untrack
app.post('/untrack_tables', async (req, res) => {
  const tableNames = req.body.table_names
  log(`Trying to untrack tables: ${tableNames.toString()}`)
  try {
    const response = await utils.untrackTables(tableNames)
    log(`Successfully untracked tables: ${tableNames.toString()}.`)
    startAdapter()
    res.json({message: 'Successful'})
  } catch(e) {
    log(`Untracking tables ${tableNames.toString()} failed. ${e.toString()}`)
    res.status(500).json(e)
  }
})

app.get('/hard_reset', (req, res) => {
  startAdapter(true)
  res.json({message: 'Successful'})
})



app.listen(process.env.PORT || 8080);
