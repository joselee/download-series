'use strict';
let http = require('http');
let fs = require('fs');
let ProgressBar = require('progress');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
let list = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/downloadqueue', (req, res) => {
    res.json(list);
});
app.post('/downloadqueue', (req, res) => {
    list.push(req.body.item);
    res.json(list);
});

app.listen(8080, function () {
    console.log('Express running on port 8080');
});

function getFileName(listItem) {
    if (typeof listItem === 'string') {
        let pathParts = listItem.split('/');
        let last = pathParts[pathParts.length - 1];
        return decodeURIComponent(last);
    }
    if (typeof listItem === 'object' && listItem.hasOwnProperty('fileName')) {
        return listItem.fileName;
    }
}

function download() {
    if (list.length === 0) {
        setTimeout(()=>{
            download();
        }, 5000);
        return false;
    }

    let request = http.get(list[0].url, (response) => {
        let listItem = list[0];
        let fileName = getFileName(listItem);
        console.log('\nDownloading "' + fileName + '":');

        let file = fs.createWriteStream(fileName);
        response.pipe(file);

        let total = parseInt(response.headers['content-length'], 10);
        let totalProgress = 0;

        let bar = new ProgressBar('    [:bar] :percent :numeric', {
            complete: '-',
            incomplete: ' ',
            width: 50,
            total: total
        });

        let intervalChunks = 0;
        response.on('data', function (chunk) {
            intervalChunks += chunk.length;
            totalProgress += chunk.length;
        });
        let tick = setInterval(() => {
            let numeric = (totalProgress / 1048576).toFixed(2) + 'MB/' + (total / 1048576).toFixed(2) + 'MB';
            bar.tick(intervalChunks, { 'numeric': numeric });
            intervalChunks = 0;
        }, 500);

        response.on('end', () => {
            clearInterval(tick);
            list.shift();
            download();
        });
    });
}
download();