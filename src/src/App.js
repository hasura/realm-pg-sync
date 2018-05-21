import React, { Component } from 'react';
import './App.css'

const fetchHandler = async (url, options) => {
  const response = await fetch(url, options)
  const jsonResponse = await response.json()
  if (response.status === 200) {
    return jsonResponse
  }
  throw {message: jsonResponse.error}
}

const Header = () => {
  return (
    <div className="header">
      <h1>Realm-Postgres-Sync</h1>
    </div>
  )
}

const ErrorBanner = ({error}) => {
  return error ? (
    <div className="error">
      {error}
    </div>
  ) : null
}

const TableList = (prop) => {
  if (prop.tables.length === 0) {
    return null
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Table Name</th>
          <th scope="col">Realm Path</th>
          <th scope="col">Sync</th>
        </tr>
      </thead>
      <tbody>
        {
          prop.tables.map((table, i) => {
            return (
              <tr key={i}>
                <th scope="row">{i+1}</th>
                <td>{table.name}</td>
                <td>{table.realmPath}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={table.isTracked}
                    onChange={(e) => {prop.actionHandler['checkboxClick'](e, table.name)}}/>
                </td>
              </tr>
            )
          })
        }
      </tbody>
    </table>
  )
}

const BottomButtons = (props) => {
  return (
    <div>
      <button
        type="button"
        className="col btn btn-primary margin-bottom"
        onClick={props.actionHandler['save']}>
        Save
      </button>
      <button
        type="button"
        className="col btn btn-danger"
        onClick={props.actionHandler['hardReset']}>
        Hard Reset
      </button>
    </div>
  )
}

const LoadingIndicator = () => (<div>Please wait</div>)

class App extends Component {

  constructor() {
    super()
    this.state = {
      error: '',
      tables: [],
      loading: false
    }
  }

  async fetchStateFromServer() {
    try {
      this.setState({
        ...this.state,
        loading: true
      })
      const tt = await fetchHandler('/tracked_tables')
      const at = await fetchHandler('/all_tables')
      this.setState({
        ...this.state,
        loading: false,
        tables: at.map((table) => {
          let returnVal = null
          tt.forEach((trackedTable) => {
            if (trackedTable.name === table) {
              returnVal =  {
                name: table,
                isTracked: true,
                realmPath: trackedTable.realm_path
              }
            }
          })
          return returnVal || { name: table, isTracked: false, realmPath: '' }
        })
      })
    } catch(e) {
      this.setState({
        ...this.state,
        error: e.message
      })
    }
  }

  async componentDidMount() {
    await this.fetchStateFromServer()
  }

  async hardReset() {
    try {
      this.setState({
        ...this.state,
        loading: true
      })
      await fetchHandler('/hard_reset')
      this.setState({
        ...this.state,
        loading: false
      })
    } catch (e) {
      this.setState({
        ...this.state,
        error: e.message
      })
    }
  }

  async retrackTables(tableNames) {
    try {
      this.setState({
        ...this.state,
        loading: true
      })
      await fetchHandler('/re_track_tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table_names: tableNames
        })
      })
      this.fetchStateFromServer()
    } catch (e) {
      this.setState({
        ...this.state,
        error: e.message
      })
    }
  }

  tablesActionHandler = {
    checkboxClick: (e, tableName) => {
      this.setState((state) => {
        state.tables = this.state.tables.map((table) => {
          if (table.name === tableName) {
            table.isTracked = !table.isTracked
          }
          return table
        })
        return state
      })
    }
  }

  bottomButtonsActionHandler = {
    save: (e) => {
      const tablesToTrack = this.state.tables.filter((table) => {
        return table.isTracked
      })
      const tableNamesArr = tablesToTrack.map((t) => {
        return t.name
      })
      this.retrackTables(tableNamesArr)
    },
    hardReset: (e) => {
      this.hardReset()
    }
  }

  render() {
    console.log(this.state)
    return (
      <div className="container-fluid">
        <Header/>
        <ErrorBanner error={this.state.error}/>
        <div className="tracked-tables-container">
          {
            this.state.loading ?
            <LoadingIndicator />
            :
            <div>
              <TableList
                tables={this.state.tables}
                actionHandler={this.tablesActionHandler}/>
              <BottomButtons actionHandler={this.bottomButtonsActionHandler}/>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
