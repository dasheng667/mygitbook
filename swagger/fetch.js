const http = require('http');

function getData (url) {
  return new Promise((resole, reject) => {
    if (!url) {
      reject('没有接口路径');
      return;
    }
    http.get(url, (res) => {
      let data = '';
      res.setEncoding('utf-8');
      res.on('data', (chunk) => {
        data += chunk;
      })
  
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resole(parsedData)
        } catch (e) {
          reject(e);
        }
      })
    })
  })
}

module.exports = getData;
