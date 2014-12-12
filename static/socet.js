var socket = null;
var user_id = 0;
var points = true;
var playerIndexUser = 0;
var session_id = '';
var HOST = false;
var CANVAS_GAME = null;
var CONTEXT_GAME = null;
var trees = [];

window.addEventListener('load', function () {
    socket = new WebSocket('ws://' + window.location.hostname + ':8888/websocket');
    socket.onmessage = function (e) {
        var data = JSON.parse(e.data);
        console.log(data.action);
        user_id = data.id;
        switch (data.action) {
            case "ready":
                if (data.data['host']) {

                    HOST = true;
                }
                if (points) {
                    ready(data.data.points);
                    points = false;
                }
                break;
            case "start":
                session_id = data.data.session_id;
                start_game(data.data);
                break;
            case "jump":
                jump(data.data.player_index);
                break;
            case "set_data":
                if (!HOST) {

                    if (gameData.gameStatus == 'active') {
                        if (gameData.frame % Math.ceil(gameData.trackSpeed) == 0) {
                            renderTree();
                        }
                    }
                    var players = gameData.players;
                    for (var i = 0; i < data.data.data.players.length; i++) {
                        if (data.data.data.players[i] != 'human') {
                            players[i] = data.data.data.players[i]
                        }
                    }
                    gameData = data.data.data;
                    gameData.players = players;
                    drawStage(CANVAS_GAME, CONTEXT_GAME);
                }
                break;
        }
    };
    socket.onopen = function () {
        socket.send(JSON.stringify({
            action: 'new'
        }));
    }
});


var start_game = function (data) {
    var i = 0, startTime = 3;
    data.clients.map(function (item) {
        if (item == user_id) {
            playerIndexUser = i;
        }
        gameData.players[i++].type = "human";
    });

    jQuery('body').append('start - ' + (startTime));
    var steps = setInterval(function () {
        jQuery('body').append('start - ' + (--startTime));
    }, startTime / startTime * 1000);
    setTimeout(function () {
        jQuery('body').append('GO!GO!');
        gameData.gameStatus = 'active';
        clearInterval(steps);
    }, startTime * 1000);

};

var socket_send = function (data) {
    socket.send(JSON.stringify(data));
};