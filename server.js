var http = require("http");
var querystring = require("querystring");
var url = require("url");
var fs = require("fs");

var routes = {
  "/get": function(request, response, db) {
    var query = urlToQueryObj(request.url);
    sendResponse(response, 200, "text/html", db.get(query.key));
  },

  "/set": function(request, response, db) {
    var query = urlToQueryObj(request.url);
    var key = Object.keys(query)[0]; // set one pair if there are many

    db.set(key, query[key]);
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

function Db(filePath) {
  var isSaving = false;
  var isSaveQueued = false;

  var data = {};
  if (fs.existsSync(filePath)) {
    var jsonStr = fs.readFileSync(filePath, "utf8");
    if (jsonStr.length > 0) {
      data = JSON.parse(jsonStr);
    }
  }

  this.set = function(key, value) {
    data[key] = value;
    saveDb();
  };

  this.get = function(key) {
    return data[key];
  };

  this.isSaving = function() {
    return isSaving;
  };

  function saveDb() {
    if (!isSaving) {
      isSaving = true;
      fs.writeFile(filePath, JSON.stringify(data), function() {
        isSaving = false;
        if (isSaveQueued) {
          isSaveQueued = false;
          saveDb();
        }
      });
    } else {
      isSaveQueued = true;
    }
  }
};

function startServer(la) {
  var db = new Db("data.json");

  var server = http.createServer(function (request, response) {
    var handler = routes[url.parse(request.url).pathname];

    if (handler !== undefined) {
      handler(request, response, db);
    } else {
      return sendResponse(response, 404, "text/html", "Not found");
    }
  }).listen(4000);

  server.shutDown = function(cb) {
    if (!db.isSaving()) {
      server.close(cb);
    } else {
      setTimeout(function() {
        server.shutDown(cb);
      }, 10);
    }
  };

  return server;
};

module.exports = startServer;

if (require.main === module) {
  startServer();
}
