var startServer = require("../server.js");
var http = require("http");
var fs = require("fs");

function getRequest(url, cb) {
  http.get(url, function(response) {
    var body = '';

    response.on('data', function(d) {
      body += d;
    });

    response.on('end', function() {
      cb(response.statusCode, body);
    });
  })
};

function all(ops, cb) {
  var completedOps = 0;
  function complete(i) {
    completedOps++;
    if (completedOps === ops.length - 1) {
      cb();
    }
  };

  ops.forEach(function(op) { op(complete); })
};

describe("server", function() {
  var server;
  beforeEach(function() {
    if (fs.existsSync("data.json")) {
      fs.unlinkSync("data.json");
    }

    server = startServer();
  });

  afterEach(function() {
    server.shutDown();
  });

  it("should return 404 for root", function(done) {
    getRequest("http://localhost:4000", function(statusCode) {
      expect(statusCode).toEqual(404);
      done();
    });
  });

  it("should return 'Set' when value set", function(done) {
    getRequest("http://localhost:4000/set?name=mary", function(_, body) {
      expect(body).toEqual("Set");
      done();
    });
  });

  it("should set and get value", function(done) {
    getRequest("http://localhost:4000/set?name=mary", function(_, body) {
      getRequest("http://localhost:4000/get?key=name", function(_, body) {
        expect(body).toEqual("mary");
        done();
      });
    });
  });

  it("should overwrite value at existing key", function(done) {
    getRequest("http://localhost:4000/set?name=mary", function(_, body) {
      getRequest("http://localhost:4000/set?name=rose", function(_, body) {
        getRequest("http://localhost:4000/get?key=name", function(_, body) {
          expect(body).toEqual("rose");
          done();
        });
      });
    });
  });

  it("should set multiple values", function(done) {
    getRequest("http://localhost:4000/set?name=mary", function(_, body) {
      getRequest("http://localhost:4000/set?height=160", function(_, body) {
        getRequest("http://localhost:4000/get?key=name", function(_, body) {
          expect(body).toEqual("mary");

          getRequest("http://localhost:4000/get?key=height", function(_, body) {
            expect(body).toEqual("160");
            done();
          });
        });
      });
    });
  });

  it("should load existing db", function(done) {
    getRequest("http://localhost:4000/set?name=mary", function(_, body) {
      server.shutDown(function() {
        server = startServer();
        getRequest("http://localhost:4000/get?key=name", function(_, body) {
          expect(body).toEqual("mary");
          done();
        });
      });
    });
  });

  it("should save a bunch of pairs", function(done) {
    var setOps = [];
    for (var i = 1; i <= 1000; i++) {
      setOps.push(i);
    }

    all(setOps.map(function(i) {
      return function(complete) {
        getRequest("http://localhost:4000/set?" + i + "=" + i, complete);
      }
    }), function() {
      server.shutDown(function() {
        server = startServer();
        all(setOps.map(function(i) {
          return function(complete) {
            getRequest("http://localhost:4000/get?key=" + i, function(_, value) {
              expect(value).toEqual(i.toString());
              complete();
            });
          }
        }), function() {
          done()
        });
      });
    });
  });
});
