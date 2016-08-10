'use strict';
let http = require('http');
let express = require('express');
let app = express();
let server = http.createServer(app);
let io = require('socket.io')(server);
let fs = require('fs');
let ProgressBar = require('progress');
let bodyParser = require('body-parser');

let list = [];
let currentDownload = {
    total: 0,
    progress: 0,
    progressSinceLastInterval: 0,
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
    list.push({ fileName: fileName, url: req.body.item.url });
    broadcast('updateList', list);
    res.send('ok');
});

let sockets = {};
io.on('connection', function (socket) {
    sockets[socket.id] = socket;
});

server.listen(8080, function () {
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
    currentDownload.progressSinceLastInterval = 0;
    currentDownload.active = false;
}

function broadcast(eventName, data) {
    let socketIds = Object.keys(sockets);
    for (let socketId in sockets) {
        if (sockets.hasOwnProperty(socketId)) {
            sockets[socketId].emit(eventName, data);
        }
    }
}

function download() {
    if (list.length === 0) {
        setTimeout(download, 1000);
        return false;
    }

    let listItem = list[0];
    let request = http.get(listItem.url, (response) => {
        console.log('\nDownloading "' + listItem.fileName + '":');
        response.pipe(fs.createWriteStream(listItem.fileName));

        currentDownload.total = parseInt(response.headers['content-length'], 10);
        currentDownload.progress = 0;
        currentDownload.progressSinceLastInterval = 0;
        currentDownload.active = true;

        let bar = new ProgressBar('    [:bar] :percent :numeric', {
            complete: '-',
            incomplete: ' ',
            width: 50,
            total: currentDownload.total
        });

        response.on('data', function (chunk) {
            currentDownload.progressSinceLastInterval += chunk.length;
            currentDownload.progress += chunk.length;
        });

        let tick = setInterval(() => {
            if (currentDownload.active) {
                let numeric = (currentDownload.progress / 1048576).toFixed(2) + 'MB/' + (currentDownload.total / 1048576).toFixed(2) + 'MB';
                bar.tick(currentDownload.progressSinceLastInterval, { 'numeric': numeric });
                currentDownload.progressSinceLastInterval = 0;

                broadcast('currentDownload', { total: currentDownload.total, progress: currentDownload.progress });
            }
        }, 500);

        response.on('end', () => {
            console.log('\n');
            clearInterval(tick);
            list.shift();
            clearCurrentDownload();
            broadcast('updateList', list);
            download();
        });
    });
}
download();