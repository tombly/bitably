
const https = require('https')

module.exports = {

  callHttp(options, data = '') {
    return new Promise((resolve, reject) => {
      const req = https.request(options,
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk.toString()));
          res.on('error', reject);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode <= 299) {
              resolve(body);
            } else {
              reject(res.statusCode);
            }
          });
        });
      req.on('error', reject);
      req.write(data, 'binary');
      req.end();
    });
  },

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

}
