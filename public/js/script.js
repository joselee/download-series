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
        }
    };
}]);
app.controller('myCtrl', ['downloadQueueService', function (downloadQueueService) {
    this.queue = [];
    downloadQueueService.get().then((res) => {
        this.queue = res.data;
        console.log(this.queue);
    });

    this.addFileName = '';
    this.addFileURL = '';
    this.add = () => {
        if (this.addFileName && this.addFileURL) {
            let item = { fileName: this.addFileName, url: this.addFileURL };
            downloadQueueService.add(item).then((res) => {
                this.queue = res.data;
            });
        }
    };
}]);
