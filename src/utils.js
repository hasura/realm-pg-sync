const fetch = require('node-fetch')
let dataUrl = 'http://data.hasura/v1/query'
if (process.env.ENV === 'DEV') {
  dataUrl = 'http://localhost:5555/v1/query'
}

async function requestHandler(url, options) {
  const response = await fetch(url, options)
  const json = await response.json()
  if (response.status === 200){
    return json
  }
  throw json
}

const getRealmType = (pgType) => {
  switch(pgType) {
    case 'text':
    case 'varchar':
    case 'text':
    case 'varchar':
    case 'character':
    case 'character varying':
    case 'tsvector':
    case 'json':
    case 'bytea':
    case 'uuid': return 'string'
    case 'numeric':
    case 'decimal':
    case 'double precision': return 'float'
    case 'bigint':
    case 'smallint':
    case 'integer': return 'int'
    case 'bool': return 'bool'
    case 'timestamp':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'date': return 'date'
  }
  throw new Error('Unsupported Postgres data type')
}

async function fetchAllTablesNamesFromPG() {
  const allTablesResponse = await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      "type":"select",
      "args": {
        "table": {
          "name":"tables",
          "schema":"information_schema"
        },
        "columns":["table_name"],
        "where":{
          "table_schema":"public",
          "table_name":{"$neq":"schema_migrations"}
        }
      }
    })
  })
  return allTablesResponse.map((t) => {
    return t.table_name
  })
}

function convertPgToRealmSchema(schema) {
  if (schema.primary_key.columns.length > 1) {
    throw new Error(`Invalid Schema: ${schema.table_name}. Every must only have one primary key. Found multiple`)
  }
  const propObj = {}
  schema.columns.forEach((column) => {
    const obj = {
      type: getRealmType(column.data_type)
    }
    if (column.column_name.indexOf(schema.primary_key.columns) === -1) {
      obj.optional = true
    }
    propObj[column.column_name] = obj
  })
  return {
      name: schema.table_name,
      primaryKey: schema.primary_key.columns[0],
      properties: propObj
  };
  const realmModels = pgSchemaArr.map((schema) => {

  })
}

async function fetchTablesToTrack() {
  const tableNamesResponse = await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      type: 'select',
      args: {
        table: 'tracked_tables',
        columns: [
          'name'
        ]
      }
    })
  })
  return tableNamesResponse.map((table) => {
    return table.name
  })
}

async function fetchPgSchema(tableNames) {
  return await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      type: 'select',
      args: {
        table: {
          name: 'hdb_table',
          schema: 'hdb_catalog'
        },
        columns: [
          'table_name',
          {
            name: 'columns',
            columns: [
              'data_type', 'column_name'
            ]
          },
          {
            name: 'primary_key',
            columns: [
              'columns'
            ]
          }
        ],
        where: {
          table_schema: 'public',
          table_name: {
            '$in': tableNames
          }
        }
      }
    })
  })
}

async function fetchRealmSchema() {
  //Fetch list of table names
  const tableNames = await fetchTablesToTrack()
  //Fetch schema for each table
  const pgSchemaArr = await fetchPgSchema(tableNames)
  //Convert from pg schema to realm schema
  const realmSchemaArr = pgSchemaArr.map(convertPgToRealmSchema)
  return realmSchemaArr
}

async function trackTables(tableNames) {
  const objs = tableNames.map((tableName) => {
    return {
      name: tableName
    }
  })
  return await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      type: 'insert',
      args: {
        table: 'tracked_tables',
        objects: objs
      }
    })
  })
}

async function untrackTables(tableNames) {
  return await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      type: 'delete',
      args: {
        table: 'tracked_tables',
        where: {
          name: {
            '$in': tableNames
          }
        }
      }
    })
  })
}

async function retrackAllTables(tableNames) {
  const objs = tableNames.map((tableName) => {
    return {
      name: tableName
    }
  })
  return await requestHandler(dataUrl, {
    method: 'POST',
    body: JSON.stringify({
      type: 'bulk',
      args: [
        {
          type: 'delete',
          args: {
            table: 'tracked_tables',
            where: {
              name: {
                '$neq': null
              }
            }
          }
        },
        {
          type: 'insert',
          args: {
            table: 'tracked_tables',
            objects: objs
          }
        }
      ]
    })
  })
}

module.exports = {
  fetchAllTablesNamesFromPG,
  convertPgToRealmSchema,
  fetchRealmSchema,
  fetchPgSchema,
  fetchTablesToTrack,
  trackTables,
  untrackTables,
  retrackAllTables
}
