var express = require('express');
var app = express();
var url = require("url");
var pg = require("pg"); 
var pgConString = "postgres://peter:peter@localhost:5432/capitalcontrols"
var bodyParser = require("body-parser");

function getYear(y) {
    return "SELECT country, year, " +
            "(rtob(mm) OR rtob(bo)) as bonds, " +
               "(rtob(ci) OR rtob(eq)) as equity, " +
           "(rtob(fc) OR rtob(cc)) as credits " +
           "FROM yearly WHERE year = " + y.toString() + ";";
}

app.use(express.static(__dirname + '/public'));


app.get('/data', function(request, response) {
    var year = url.parse(request.url, true).query.year;
    pg.connect(pgConString, function(err, client, done) {
        if (err) {
            done();
            return console.error('pg error');
        }
        client.query(getYear(year), function(err, result) {
            done();
            if (err) {
                console.log('failed query');
                return data;
            }
            response.json(result.rows);
        });
    });
});

app.listen(8080, function () {
    console.log('Started');
});
