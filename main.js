var express = require('express');
var app = express();
var url = require("url");
var pg = require("pg"); 
var pgConString = process.env.DATABASE_URL || "postgres://peter:peter@localhost:5432/capitalcontrols";
var bodyParser = require("body-parser");

//function getQuery(y, c) {
//    return "SELECT yearly.country, year, " +
//            "(rtob(mm) OR rtob(bo)) as bonds, " +
//               "(rtob(ci) OR rtob(eq)) as equity, " +
//           "(rtob(fc) OR rtob(cc)) as credits " +
//           "FROM yearly, clustering WHERE yearly.year = " + y.toString() + 
//           " AND yearly.country = clustering.country AND " + 
//           "clustering."+ c.toString() + " = 'gate';";
//}

var baseMsg = "SELECT yearly.country, year, " +
              "(rtob(mm) OR rtob(bo)) as bonds, " +
              "(rtob(ci) OR rtob(eq)) as equity, " +
              "(rtob(fc) OR rtob(cc)) as credits " +
              "FROM yearly, clustering WHERE" + 
              " yearly.country = clustering.country AND ";

var income = {'high' : 'yearly.hgh', 
              'mid' : 'yearly.umd',
              'low' : '(yearly.lmd OR yearly.low)'};

function getAll(c) {
    return baseMsg + "clustering."+ c.toString() + " = 'gate'";
}

function getByIncome(c, inc) {
    return baseMsg + "clustering."+ c.toString() + " = 'gate' " +
           "AND " + income[inc];
}
function getByPeg(c, peg) {
    return baseMsg + "clustering."+ c.toString() + " = 'gate' " +
           "AND yearly.peg = " + peg.toString();
}
app.use(express.static(__dirname + '/public'));

app.get('/data', function(request, response) {
    var cluster = url.parse(request.url, true).query.cluster;
    var yearMin = url.parse(request.url, true).query.yearMin;
    var yearMax = url.parse(request.url, true).query.yearMax;
    var income = url.parse(request.url, true).query.income;
    var peg = url.parse(request.url, true).query.peg;
    pg.connect(pgConString, function(err, client, done) {
        var query;
        if (err) {
            done();
            return console.error('pg error');
        } else if (income) {
            query = getByIncome(cluster, income);
        } else if (peg) {
            query = getByPeg(cluster, peg);
        } else {
            query = getAll(cluster);
        }

        if (yearMin && yearMax) {
            query += ' AND yearly.year >= ' + yearMin.toString() + ' AND ' +
                     'yearly.year <= ' + yearMax.toString();
        }

        query += ';';
        client.query(query, function(err, result) {
            done();
            if (err) {
                return console.error('failed query' + err);
                
            }
            response.json(result.rows);
        });
    });
});

app.listen(8080, function () {
    console.log('Started');
});
