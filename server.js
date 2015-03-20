var http = require("http");
var querystring = require("querystring");
var url = require("url");

var routes = {
  "/get": function(request, response, db) {
    var query = urlToQueryObj(request.url);
    sendResponse(response, 200, "text/html", db[query.key]);
  },

  "/set": function(request, response, db) {
    var query = urlToQueryObj(request.url);
    var key = Object.keys(query)[0]; // set one pair if there are many

    db[key] = query[key];
    sendResponse(response, 200, "text/html", "Set");
  }
};

function urlToQueryObj(urlStr) {
  return url.parse(urlStr, true).query;
};

function sendResponse(response, httpCode, contentType, body) {
  response.writeHead(httpCode, { "Content-Type": contentType });
  return response.end(body);
};

function startServer() {
  var db = {};

  return http.createServer(function (request, response) {
    var handler = routes[url.parse(request.url).pathname];

    if (handler !== undefined) {
      handler(request, response, db);
    } else {
      return sendResponse(response, 404, "text/html", "Not found");
    }
  }).listen(4000);
};

module.exports = startServer;
if (require.main === module) {
  startServer();
}
