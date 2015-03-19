var startServer = require("../server.js");
var http = require("http");

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

describe("server", function() {
  var server;
  beforeEach(function() {
    server = startServer();
  });

  afterEach(function() {
    server.close();
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
});
