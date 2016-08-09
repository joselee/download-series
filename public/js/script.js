'use strict';
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
        },
        getCurrentDownloadInfo: () => {
            return $http.get('/currentdownload');
        }
    };
}]);
app.controller('myCtrl', ['downloadQueueService', function (downloadQueueService) {
    this.queue = [];
    downloadQueueService.get().then((res) => {
        this.queue = res.data;
    });

    this.addFileName = '';
    this.addFileURL = '';
    this.add = () => {
        if (this.addFileURL) {
            let item = { fileName: this.addFileName, url: this.addFileURL };
            downloadQueueService.add(item).then((res) => {
                this.queue = res.data;
                this.addFileName = "";
                this.addFileURL = "";
            });
        }
    };

    this.currentDownloadPercent = 0;
    setInterval(() => {
        downloadQueueService.getCurrentDownloadInfo().then((res) => {
            if (res.data.progress && res.data.progress !== 0) {
                this.currentDownloadPercent = (res.data.progress/res.data.total * 100).toFixed(2);
            }
        });
    }, 1000);
}]);
