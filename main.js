var express = require('express');
var app = express();
var url = require("url");
var pg = require("pg"); 
var pgclient = new Client(pgConString);
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
    pgclient.query(getYear(year), function(err, result) {
        if (err) {
            console.log("Failed query");
        }
        response.json(result.rows);
    console.log(year);
    response.json({year: 1995});
});

app.listen(8080, function () {
    console.log('Started');
});
