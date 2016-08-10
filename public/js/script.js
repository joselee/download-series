'use strict';
// test download file http://download.thinkbroadband.com/50MB.zip
let app = angular.module('myApp', []);
app.factory('downloadQueueService', ['$http', function ($http) {
    return {
        get: () => {
            return $http.get('/downloadqueue');
        },
        add: (item) => {
            return $http.post('/downloadqueue', { item: item });
        },
        remove: () => {
            return $http.delete('/downloadqueue');
        }
    };
}]);
app.controller('myCtrl', ['downloadQueueService', '$timeout', function (downloadQueueService, $timeout) {
    this.queue = [];
    downloadQueueService.get().then((res) => {
        this.queue = res.data;
    });

    this.json = '';
    this.addFileName = '';
    this.addFileURL = '';
    this.add = () => {
        if (this.inputMode === 'form' && this.addFileURL) {
            let item = [{ fileName: this.addFileName, url: this.addFileURL }];
            downloadQueueService.add(item).then((res) => {
                this.addFileName = '';
                this.addFileURL = '';
            });
        } else if (this.inputMode === 'json' && this.json){
            let json = JSON.parse(this.json);
            downloadQueueService.add(json).then((res) => {
                this.json = '';
            });
        }
    };
    this.testAdd = () => {
        this.addFileURL = 'http://download.thinkbroadband.com/50MB.zip';
        this.add();
    }

    this.currentDownloadPercent = 0;
    var socket = io();
    socket.on('currentDownload', (data) => {
        $timeout(()=>{
            this.currentDownloadPercent = (data.progress/data.total * 100).toFixed(2);
        });
    });
    socket.on('updateList', (data) => {
        $timeout(()=>{
            this.queue = data;
        });
    });

    this.inputMode = 'form';
    this.toggleInputMode = (mode) => {
        this.inputMode = mode;
    };
}]);
