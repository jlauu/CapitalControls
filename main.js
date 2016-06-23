var express = require('express');
var app = express();
var url = require("url");
var pg = require("pg"); 
var pgConString = process.env.DATABASE_URL || "postgres://peter:peter@localhost:5432/capitalcontrols";
var bodyParser = require("body-parser");
var port = process.env.PORT || 8080;

var baseMsg = "SELECT yearly.country, year, " +
              "(rtob(mm) OR rtob(bo)) as bonds, " +
              "(rtob(ci) OR rtob(eq)) as equity, " +
              "(rtob(fc) OR rtob(cc)) as credits " +
              "FROM yearly, clustering WHERE" + 
              " yearly.country = clustering.country";

var income = {'high' : 'yearly.hgh', 
              'mid' : 'yearly.umd',
              'low' : '(yearly.lmd OR yearly.low)'};

function getQuery(q) {
        var query = baseMsg;
        if (q.cluster && q.ctryType) {
            query += " AND clustering."+ q.cluster.toString() + " = '" +
                     q.ctryType.toString() + "'";
        }
        if (q.income) {
            query += " AND " + income[q.income];
        }
        if (q.peg != null) {
            query += " AND yearly.peg = " + q.peg.toString();
        } 
        if (q.yearMin && q.yearMax) {
            query += ' AND yearly.year >= ' + q.yearMin.toString() + ' AND ' +
                     'yearly.year <= ' + q.yearMax.toString();
        }
        return query + ";";
}

app.use(express.static(__dirname + '/public'));

app.get('/data', function(request, response) {
    var cluster = url.parse(request.url, true).query.cluster;
    var yearMin = url.parse(request.url, true).query.yearMin;
    var yearMax = url.parse(request.url, true).query.yearMax;
    var income = url.parse(request.url, true).query.income;
    var peg = url.parse(request.url, true).query.peg;
    var ctryType = url.parse(request.url, true).query.ctryType;
    pg.connect(pgConString, function(err, client, done) {
        var query = getQuery(url.parse(request.url, true).query);
        if (err) {
            done();
            return console.error('pg error');
        }
        client.query(query, function(err, result) {
            done();
            if (err) {
                return console.error('failed query' + err);
                
            }
            response.json(result.rows);
        });
    });
});

app.listen(port, function () {
    console.log('Started');
});
