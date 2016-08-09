'use strict';
let http = require('http');
let fs = require('fs');
let ProgressBar = require('progress');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let list = [];
let currentDownload = {
    total: 0,
    progress: 0,
    active: false
};


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/downloadqueue', (req, res) => {
    res.json(list);
});
app.post('/downloadqueue', (req, res) => {
    let fileName = getFileName(req.body.item);
    list.push({fileName: fileName, url: req.body.item.url});
    res.json(list);
});
app.get('/currentdownload', (req, res) => {
    res.json(currentDownload);
});

app.listen(8080, function () {
    console.log('Express running on port 8080');
});

function getFileName(listItem) {
    if (listItem.fileName) {
        return listItem.fileName;
    } else {
        let pathParts = listItem.url.split('/');
        let last = pathParts[pathParts.length - 1];
        return decodeURIComponent(last);
    }
}

function clearCurrentDownload() {
    currentDownload.total = 0;
    currentDownload.progress = 0;
    currentDownload.active = false;
}

function download() {
    if (list.length === 0) {
        setTimeout(()=>{
            download();
        }, 5000);
        return false;
    }

    let listItem = list[0];
    let request = http.get(listItem.url, (response) => {
        console.log('\nDownloading "' + listItem.fileName + '":');
        let file = fs.createWriteStream(listItem.fileName);
        response.pipe(file);

        currentDownload.active = true;
        currentDownload.total = parseInt(response.headers['content-length'], 10);
        currentDownload.progress = 0;

        let bar = new ProgressBar('    [:bar] :percent :numeric', {
            complete: '-',
            incomplete: ' ',
            width: 50,
            total: currentDownload.total
        });

        let intervalChunks = 0;
        response.on('data', function (chunk) {
            intervalChunks += chunk.length;
            currentDownload.progress += chunk.length;
        });
        let tick = setInterval(() => {
            let numeric = (currentDownload.progress / 1048576).toFixed(2) + 'MB/' + (currentDownload.total / 1048576).toFixed(2) + 'MB';
            bar.tick(intervalChunks, { 'numeric': numeric });
            intervalChunks = 0;
        }, 500);

        response.on('end', () => {
            clearInterval(tick);
            list.shift();
            clearCurrentDownload();
            download();
        });
    });
}
download();