'use strict';
let http = require('http');
let fs = require('fs');
let ProgressBar = require('progress');

let list = [
    {
        fileName: '[DBNL] DragonBall - 119 - Battle Cry [DR][x264][E2F57A88].mkv',
        url: 'http://131.72.136.217:8000/DragonBall%5BDBNL%5D.-.153.%2B.Specials.-.Complete/%5BDBNL%5D%20DragonBall%20-%20119%20-%20Battle%20Cry%20%5BDR%5D%5Bx264%5D%5BE2F57A88%5D.mkv'
    }
];

function getFileName(listItem) {
    if(typeof listItem === 'string'){
        let pathParts = listItem.split('/');
        let last = pathParts[pathParts.length - 1]; 
        return decodeURIComponent(last);
    } 
    if (typeof listItem === 'object' && listItem.hasOwnProperty('fileName')) {
        return listItem.fileName;
    }
}

function download() {
    let request = http.get(list[0].url, (response) => {
        let listItem = list[0];
        let fileName = getFileName(listItem);
        console.log('Downloading "' + fileName + '":');

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
            let numeric = (totalProgress/1048576).toFixed(2) + 'MB/' + (total/1048576).toFixed(2) + 'MB';
            bar.tick(intervalChunks, {'numeric': numeric});
            intervalChunks = 0;
        }, 500);

        response.on('end', ()=> {
            clearInterval(tick);
            list.shift();
            if (list.length > 0) {
                download();
            }
        });
    });
}

download();