import React from 'react';

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: null,
      value: '',
      lines: [],
      results: []
    };

    this.onChange = this.onChange.bind(this);
  }
  render() {
    const results = this.state.results;

    return (
      <div className="app-container">
        <div className="search-container">
          <label>Search against README:</label>
          <input
            type="text"
            value={this.state.value}
            onChange={this.onChange} />
        </div>
        <div className="results-container">
          <Results results={results} />
        </div>
      </div>
    );
  }
  onChange(e) {
    const value = e.target.value;
    const index = this.state.index;
    const lines = this.state.lines;

    // Set captured value to input
    this.setState({
      value
    });

    // Search against lines and index if they exist
    if(lines && index) {
      this.setState({
        results: this.search(lines, index, value)
      });

      return;
    }

    // If the index doesn't exist, we need to set it up.
    // Unfortunately we cannot pass the path so we need to
    // hardcode it (Webpack uses static analysis).
    //
    // You could show loading indicator here as loading might
    // take a while depending on the size of the index.
    loadIndex().then(lunr => {
      // Search against the index now.
      this.setState({
        index: lunr.index,
        lines: lunr.lines,
        results: this.search(lunr.lines, lunr.index, value)
      });
    }).catch(err => {
      // Something unexpected happened (connection lost
      // for example).
      console.error(err);
    });
  }
  search(lines, index, query) {
    // Search against index and match README lines against the results.
    return index.search(query.trim()).map(match => lines[match.ref]);
  }
};

const Results = ({results}) => {
  if(results.length) {
    return (<ul>{
      results.map((result, i) => <li key={i}>{result}</li>)
    }</ul>);
  }

  return <span>No results</span>;
};

function loadIndex() {
  // Here's the magic. Set up `require.ensure` to tell Webpack
  // to split here and load our search index dynamically.
  //
  // The first parameter defines possible dependencies that
  // must be loaded first. Given there aren't any, we will
  // leave it as an empty array.
  return new Promise((resolve, reject) => {
    try {
      require.ensure([], require => {
        const lunr = require('lunr');
        const search = require('../search_index.json');

        resolve({
          index: lunr.Index.load(search.index),
          lines: search.lines
        });
      });
    }
    catch(err) {
      reject(err);
    }
  });
}
