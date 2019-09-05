const argv = require('yargs').argv;
const fetch = require('./fetch');
const buildApiJson = require('./buildApiJson');
const { url = '', name = 'boms'} = argv;
const fetchUrl = 'url';

fetch(fetchUrl).then((json) => {
  if(json){
    buildApiJson(json)
  }
}).catch(err => {
  console.error(err);
})
