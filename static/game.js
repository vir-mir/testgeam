var gameData, spritesMeta, sprites, deers, trees, background, tracks, snow, sounds;
var iOS, firefox;
var winnerTimer, runTimer;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playSound(soundName) {
    if (!firefox && !iOS) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play();
    }
}

function drawSprite(spriteName, context, x, y) {
    var spriteInfo = spritesMeta[spriteName];
    if (!spriteInfo) {
        console.log(spriteName);
    }
    context.drawImage(sprites, spriteInfo.x, spriteInfo.y, spriteInfo.width, spriteInfo.height, x, y, spriteInfo.width, spriteInfo.height);
}

function drawStage(canvas, context) {

    drawBackground(canvas, context);
    drawTracks(canvas, context);
    switch (gameData.gameStatus) {
        case 'end':
        case 'prelost':
        case 'lost':
        case 'won':
            drawHouse(canvas, context);
            break;
    }
    var i, p;

    var player, step, p;
    for (p = 0; p < gameData.players.length; ++p) {
        player = gameData.players[p];
        for (i = 0; i < trees[p].length; ++i) {
            if (trees[p][i].x > -50 && trees[p][i].x <= canvas.width) {
                drawSprite('tree_' + p + '_' + trees[p][i].status + '_' + trees[p][i].tile, context, trees[p][i].x, gameData.baselineY + gameData.trackHeight * p);
            }
        }

        drawSprite('name_' + p, context, gameData.tracksOffset, gameData.baselineY + gameData.trackHeight * p);

        step = player.step
        if (player.status == 'jump') {
            if (step > 0) {
                step = 5;
            } else {
                step = 0;
            }
        } else if (player.status == 'collided') {
            if (step > 1 && step < gameData.collisionLength - 3) {
                step = 2;
            } else if (step >= gameData.collisionLength - 3) {
                step -= 2;
            }
        }
        var sprite = 'deer_' + p + '_' + player.status + '_' + step;
        drawSprite(sprite, context, player.positionX, player.positionY);
    }
    if (gameData.gameStatus == 'end') {
        drawCredits(canvas, context);
        drawFirework(canvas, context);
    }
    if (gameData.gameStatus == 'won') {
        drawCredits(canvas, context);
        drawSmoke(canvas, context);
        drawStartGame(canvas, context);
    }
    if (gameData.gameStatus == 'prelost') {
    }
    if (gameData.gameStatus == 'lost') {
        drawSmoke(canvas, context);
        drawFailGame(canvas, context);
    }
    if (gameData.gameStatus == 'new') {
        drawStartGame(canvas, context);
    }
    drawSnow(canvas, context);
}

function drawBackground(canvas, context) {
    var x = 0;
    var width = 513;
    var height = 745;
    context.fillStyle = 'rgb(255, 255, 255)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    while (x < canvas.width) {
        context.drawImage(background, 0, 0, width, height, x, 0, width, height);
        x += width;
    }
}

function drawTracks(canvas, context) {
    var x = gameData.tracksPosition;
    var width = 330;
    var height = 419;
    while (x < canvas.width) {
        context.drawImage(tracks, 0, 0, width, height, x, 198, width, height);
        x += width;
    }
}

function drawSnow(canvas, context) {
    var x = gameData.snowPositionX;
    var y;
    var width = 480;
    var height = 410;
    var realHeight = 0;
    while (x < canvas.width) {
        y = gameData.snowPositionY;
        while (y < 676) {
            if (y + height > 676) {
                realHeight = 676 - y;
            } else {
                realHeight = height;
            }
            context.drawImage(snow, 0, 0, width, realHeight, x, y, width, realHeight);
            y += height;
        }
        x += width;
    }
}

function drawSmoke(canvas, context) {
    drawSprite('smoke_' + gameData.winner + '_' + gameData.smokeStep, context, canvas.width - 86, gameData.housePositionY - 10);
}

function drawHouse(canvas, context) {
    drawSprite('house_' + gameData.winner, context, canvas.width - 138, gameData.housePositionY + 20);
}

function drawFirework(canvas, context) {
    drawSprite('firework_' + gameData.fireworkStep, context, canvas.width - 164, gameData.housePositionY - 100);
}

function drawCredits(canvas, context) {
    var x = Math.floor((canvas.width - 600) / 2);
    context.drawImage(sprites, 35 * 120, 0, 680, 480, x, gameData.creditsPosition, 680, 480);
}

function drawStartGame(canvas, context) {
    var x = Math.floor((canvas.width - 420) / 2);
    context.drawImage(sprites, 4886, 300, 420, 35, x, 70, 420, 35);
}

function drawFailGame(canvas, context) {
    var x = Math.floor((canvas.width - 420) / 2);
    context.drawImage(sprites, 4886, 240, 420, 35, x, 60, 420, 35);
    context.drawImage(sprites, 4886, 300, 420, 40, x, 105, 420, 40);
}

function jump(playerIndex) {
    var player = gameData.players[playerIndex];
    if (player.status == 'running') {
        if (HOST || player.type == 'human') {
            socket_send({
                action: 'jump',
                user_id: user_id,
                session_id: session_id,
                player_index: playerIndex
            });
        }

        playSound('jump');
        if (player.stepSize < 13) {
            player.stepSize += 3;

            switch (player.stepSize) {
                case 6:
                    player.jumpLength = 6;
                    break;
                case 9:
                    player.jumpLength = 5;
                    break;
                case 12:
                    player.jumpLength = 4;
                    break;
            }
        }
        player.status = 'jump';
        player.step = 0;
    }
}

var ready = function (treeOffsets) {

    gameData = {
        canvas: null,
        context: null,
        timer: null,
        trackLength: 0,
        tracksOffset: 50,
        tracksPosition: 0,
        maxPlayerPostion: 0,
        treeOffsets: treeOffsets,

        snowPositionX: 0,
        snowPositionY: -410,
        creditsPosition: -500,
        creditsStep: 10,
        fireworkStep: 0,
        fireworkCount: 0,
        housePositionY: -200,
        smokeStep: 0,
        winner: 0,
        lostStep: 0,

        gameStatus: 'new',
        gameSpeed: 2,
        trackSpeed: 2,
        stepSize: 3,
        jumpHeight: 85,
        jumpLength: 8,
        collisionLength: 7,
        baselineY: 80,
        trackHeight: 135,

        treeSpace: 120,
        treeStep: 12,

        humanIndex: 0,

        players: [{
            step: 3,
            positionX: 0,
            positionY: 0,
            jumpLength: 8,
            speed: 1,
            stepSize: 3,
            status: 'running',
            type: 'human'
        }, {
            step: 0,
            positionX: 0,
            positionY: 0,
            jumpLength: 8,
            speed: 1,
            stepSize: 3,
            status: 'running',
            type: 'npc'
        }/*, {
            step: 0,
            positionX: 0,
            positionY: 0,
            jumpLength: 8,
            speed: 1,
            stepSize: 3,
            status: 'running',
            type: 'npc'
        }, {
            step: 0,
            positionX: 0,
            positionY: 0,
            jumpLength: 8,
            speed: 1,
            stepSize: 3,
            status: 'running',
            type: 'npc'
        }*/]
    }

    tracks = new Image();
    tracks.src = 'http://artgorbunov.ru/2013/images/tracks.png';

    snow = new Image();
    snow.src = 'http://artgorbunov.ru/2013/images/snow.png';

    background = new Image();
    background.src = 'http://artgorbunov.ru/2013/images/background.png';

    sprites = new Image();
    sprites.src = 'http://artgorbunov.ru/2013/images/sprites-2.0.png';
    var spriteSize = 120;

    sounds = {
        jump: new Audio(),
        collide: new Audio(),
        run: new Audio(),
        winner: new Audio()
    }

    sounds['jump'].src = 'http://artgorbunov.ru/2013/sounds/jump.mp3';
    sounds['jump'].volume = 0.2;
    sounds['collide'].src = 'http://artgorbunov.ru/2013/sounds/collide.mp3';
    sounds['collide'].volume = 0.2;
    sounds['run'].src = 'http://artgorbunov.ru/2013/sounds/run.mp3';
    sounds['run'].volume = 1;
    sounds['winner'].src = 'http://artgorbunov.ru/2013/sounds/winner.mp3';
    sounds['winner'].volume = 0.2;

    spritesMeta = {
        house_0: {
            x: 26 * spriteSize,
            y: 20,
            width: spriteSize,
            height: spriteSize - 20
        },
        house_2: {
            x: 27 * spriteSize,
            y: 20,
            width: spriteSize,
            height: spriteSize
        },
        house_1: {
            x: 26 * spriteSize,
            y: spriteSize + 20,
            width: spriteSize,
            height: spriteSize - 20
        },
        house_3: {
            x: 27 * spriteSize,
            y: spriteSize + 20,
            width: spriteSize,
            height: spriteSize - 20
        }
    }

    for (var p = 0; p < gameData.players.length; ++p) {
        var player = gameData.players[p];

        for (var i = 0; i < 5; ++i) {
            spritesMeta['deer_' + p + '_running_' + i] = {
                x: i * spriteSize,
                y: p * spriteSize,
                width: spriteSize,
                height: spriteSize
            }
        }
        for (var i = 5; i < 14; ++i) {
            spritesMeta['deer_' + p + '_jump_' + (i - 5)] = {
                x: i * spriteSize,
                y: p * spriteSize,
                width: spriteSize,
                height: spriteSize
            }
        }
        for (var i = 6; i < 9; ++i) {
            spritesMeta['deer_' + p + '_walking_' + (i - 6)] = {
                x: i * spriteSize,
                y: p * spriteSize,
                width: spriteSize,
                height: spriteSize
            }
        }
        for (var i = 14; i < 20; ++i) {
            spritesMeta['deer_' + p + '_collided_' + (i - 14)] = {
                x: i * spriteSize,
                y: p * spriteSize,
                width: spriteSize,
                height: spriteSize
            }
        }
        for (var i = 0; i < 7; ++i) {
            spritesMeta['smoke_' + p + '_' + i] = {
                x: i * 25 + 2886,
                y: p * 50 + 240,
                width: 25,
                height: 50
            }
        }
        spritesMeta['deer_' + p + '_winner_0'] = {
            x: 20 * spriteSize,
            y: p * spriteSize,
            width: spriteSize,
            height: spriteSize
        };
        spritesMeta['deer_' + p + '_lost_0'] = {
            x: 21 * spriteSize,
            y: p * spriteSize,
            width: spriteSize,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_standing_1'] = {
            x: 29 * spriteSize + 11,
            y: p * spriteSize,
            width: 60,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_broken_1'] = {
            x: 30 * spriteSize + 11,
            y: p * spriteSize,
            width: spriteSize,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_standing_2'] = {
            x: 29 * spriteSize + 11,
            y: p * spriteSize,
            width: 60,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_broken_2'] = {
            x: 30 * spriteSize + 11,
            y: p * spriteSize,
            width: spriteSize,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_standing_3'] = {
            x: 22 * spriteSize + 11,
            y: p * spriteSize,
            width: 60,
            height: spriteSize
        };
        spritesMeta['tree_' + p + '_broken_3'] = {
            x: 23 * spriteSize + 11,
            y: p * spriteSize,
            width: spriteSize,
            height: spriteSize
        };
        spritesMeta['name_' + p] = {
            x: 26 * spriteSize,
            y: 245 + (p * 60),
            width: 300,
            height: 50
        };
    }
    for (var i = 0; i < 9; ++i) {
        spritesMeta['firework_' + i] = {
            x: i * 175 + 4866,
            y: 0,
            width: 175,
            height: 123
        }
    }

    jQuery(document).bind('keydown',
        function (event) {
            switch (event.which) {
                case 32:

                    event.preventDefault();
                    event.stopPropagation();
                    switch (gameData.gameStatus) {
                        case 'active':
                            jump(playerIndexUser);
                            break;
                        case 'lost':
                        case 'won':
                            initializeGame(gameData.canvas, gameData.context);
                            gameData.gameStatus = 'active';
                            break;
                        case 'new':
                            socket_send({
                                "action": "go"
                            });
                            break;
                    }
                    return false;
                    break;
            }
        }
    );

    jQuery('#game-2013').bind('touchstart',
        function (event) {
            switch (gameData.gameStatus) {
                case 'active':
                    jump(playerIndexUser);
                    break;
                case 'lost':
                case 'won':
                    initializeGame(gameData.canvas, gameData.context);
                    gameData.gameStatus = 'active';
                    break;
                case 'new':
                    gameData.gameStatus = 'active';
                    break;
                    return false;
            }
        }
    );
    var container = document.getElementById('game-2013');
    if (document.getElementById('like-2013')) {
        document.getElementById('like-2013').style.display = 'block';
    }
    var initGame = false;
    if (container) {
        if (!window.opera) {
            initGame = true;
            var canvas = document.createElement('canvas');
            if (canvas) {
                initGame = true;
            } else {
                initGame = false;
            }
        }
    }
    if (initGame) {
        container.appendChild(canvas);
        //document.getElementById('like-2013').style.display = 'block';
        background.onload = function () {
            sprites.onload = function () {

                if (canvas.getContext) {
                    canvas.width = 900;
                    var context = canvas.getContext('2d');
                    canvas.height = 745;
                    jQuery(window).resize(
                        function () {
                            canvas.width = 900;
                            drawStage(canvas, context);
                        }
                    );

                    initializeGame(canvas, context);
                    startRender();
                    gameData.canvas = canvas;
                    gameData.context = context;
                    drawStage(canvas, context);

                }
            }
        }
    } else {
        container.style.height = '0';
        container.style.marginTop = '0';
    }
    iOS = false;
    p = navigator.platform;
    if (p === 'iPad' || p === 'iPhone' || p === 'iPod') {
        iOS = true;
    }
    firefox = (navigator.userAgent.indexOf("Firefox") > -1);
}


function initializeGame(canvas, context) {

    var treePositions = [];
    trees = [];
    if (jQuery('.new-logo').length > 0) {
        gameData.tracksOffset = jQuery('.new-logo').offset().left;
    }

    gameData.creditsPosition = -500;
    gameData.housePositionY = -200;
    gameData.fireworkStep = 0;
    gameData.fireworkCount = 0;
    gameData.smokeStep = 0;
    gameData.lostStep = 0;
    gameData.maxPlayerPosition = 0;
    gameData.nextTreeOffset = 0;

    var currentTreeOffset = 100;
    var randomOffset = gameData.treeOffsets.shift();
    while (currentTreeOffset < canvas.width) {
        currentTreeOffset += randomOffset + gameData.treeSpace + 45;
        if (currentTreeOffset < canvas.width - 200) {
            treePositions.push({
                x: currentTreeOffset,
                status: 'standing'
            });
        }
    }

    for (var p = 0; p < gameData.players.length; ++p) {
        var player = gameData.players[p];
        player.positionX = gameData.tracksOffset - 10;
        player.positionY = gameData.baselineY + gameData.trackHeight * p;
        player.step = 0,
            jumpLength = 8,
            player.speed = 1;
        player.stepSize = 3;
        player.status = 'running';
        trees[p] = [];
    }

    var currentTreeOffset = 100;
    while (currentTreeOffset < canvas.width - 200) {
        var currentTree = getRandomInt(1, 3);
        randomOffset = gameData.treeOffsets.shift();
        currentTreeOffset += randomOffset + gameData.treeSpace + 45;

        if (currentTreeOffset < canvas.width - 200) {
            for (var p = 0; p < gameData.players.length; ++p) {
                trees[p].push({
                    x: currentTreeOffset,
                    tile: currentTree,
                    status: 'standing'
                });
            }
        }
    }
}

function startRender() {
    var frame = 0;
    gameData.timer = setInterval(
        function () {
            gameData.trackLength = gameData.canvas.width - 200;
            var i, player;
            if (gameData.gameStatus == 'active') {
                if (!firefox && !iOS) {
                    if (runTimer == null) {
                        runTimer = setTimeout(
                            function () {
                                sounds['winner'].pause();
                                sounds['run'].addEventListener('ended',
                                    function () {
                                        this.currentTime = 0;
                                        this.play();
                                    },
                                    false);
                                sounds['run'].play();
                            },
                            1
                        );
                    }
                }
                var hasWinner = false;
                for (i = 0; i < gameData.players.length; ++i) {
                    player = gameData.players[i];
                    if (frame % Math.ceil(gameData.gameSpeed / player.speed) == 0) {
                        player.step++;
                        player.positionX += player.stepSize;
                        switch (player.status) {
                            case 'running':
                                if (player.step > 4) {
                                    player.step = 0;
                                }
                                break;
                            case 'jump':
                                if (player.step > player.jumpLength) {
                                    player.step = 4;
                                    player.status = 'running';
                                }
                                player.positionX++;
                                break;
                            case 'collided':
                                if (player.step > gameData.collisionLength) {
                                    player.step = 4;
                                    player.status = 'running';
                                }
                                player.positionX++;
                                break;
                        }
                    }
                    if (player.positionX >= gameData.trackLength - 100) {
                        if (!hasWinner) {
                            gameData.gameStatus = 'end';
                            player.status = 'walking';
                            player.step = 0;
                            hasWinner = true;
                        }
                    }
                }

                var i, p, player, randomOffset, treeOffset, randomTree;
                //randomOffset = getRandomInt(20, 200);

                randomTree = 3;getRandomInt(1, 3);
                randomOffset = 200;getRandomInt(30 * randomTree, 200);
                if (frame % Math.ceil(gameData.trackSpeed) == 0) {
                    gameData.tracksPosition -= gameData.treeStep;
                    if (gameData.tracksPosition <= -330) {
                        gameData.tracksPosition += 330;
                    }

                    gameData.snowPositionX -= 3;
                    if (gameData.snowPositionX <= -480) {
                        gameData.snowPositionX += 480;
                    }

                    gameData.snowPositionY += 1;
                    if (gameData.snowPositionY >= 0) {
                        gameData.snowPositionY -= 410;
                    }

                    treeOffset = randomOffset + gameData.treeSpace + 45;
                    for (p = 0; p < gameData.players.length; ++p) {
                        player = gameData.players[p];
                        for (i = 0; i < trees[p].length; ++i) {
                            trees[p][i].x = trees[p][i].x - gameData.treeStep;
                        }
                        if (trees[p][0].x <= -45) {
                            trees[p].shift();
                        }
                        if ((trees[p][trees[p].length - 1].x < gameData.canvas.width - treeOffset) && (gameData.canvas.width - gameData.maxPlayerPosition > 500)) {
                            //console.log(trees[p][trees[p].length - 1].x < gameData.canvas.width - treeOffset);
                            //console.log(gameData.canvas.width - gameData.maxPlayerPosition);
                            trees[p].push({
                                x: treeOffset + trees[0][trees[p].length - 1].x,
                                tile: randomTree,
                                status: 'standing'
                            });
                        }

                        if (player.status == 'running') {
                            for (i = 0; i < trees[p].length; ++i) {
                                treeBack = trees[p][i].x;
                                var treeFront, treeBack, playerFront, playerBack;
                                treeFront = treeBack + 60;
                                playerBack = player.positionX + 20;
                                playerFront = playerBack + 50;
                                var jumped = false;
                                if (player.type == 'npc' && HOST) {
                                    jumped = getRandomInt(1, 100) > 26;
                                    //jumped = false;
                                    if (jumped) {
                                        var spaceToJump = treeBack - playerFront;
                                        if (spaceToJump >= 0 && spaceToJump <= (player.stepSize + gameData.treeStep)) {
                                            jump(p);
                                        }
                                    }
                                }

                                if (!jumped) {
                                    if (playerFront > treeBack && playerBack < treeFront) {

                                        if (player.status != 'walking') {
                                            playSound('collide');
                                            trees[p][i].status = 'broken';
                                            player.status = 'collided';
                                            player.step = 0;
                                        }
                                        player.stepSize = gameData.stepSize;
                                        player.jumpLength = gameData.jumpLength;
                                        break;
                                    }
                                }

                            }
                        }
                    }
                }
            } else if (gameData.gameStatus == 'end') {
                if (!firefox && !iOS) {
                    clearTimeout(runTimer);
                    runTimer = null;
                    sounds['run'].pause();

                }
                winnerType = 'human';
                var houseShown = false;
                for (var p = 0; p < gameData.players.length; ++p) {
                    var player = gameData.players[p];

                    if (player.status != 'walking' && player.status != 'winner') {
                        player.status = 'lost';
                        player.step = 0;
                    } else {
                        winnerType = player.type;
                        if (!houseShown) {
                            gameData.winner = p;
                            gameData.housePositionY = p * gameData.trackHeight + gameData.baselineY - 3;
                            houseShown = true;
                        }

                    }
                }
                if (gameData.players[0].status == 'walking' || gameData.players[0].status == 'winner') {
                    if (winnerTimer == null) {
                        winnerTimer = setTimeout(
                            function () {
                                if (!firefox && !iOS) {
                                    playSound('winner');
                                }
                            },
                            1
                        );
                    }
                    if (gameData.players[0].status == 'walking') {
                        if (frame % 3 == 0) {
                            gameData.players[0].step++;
                            if (gameData.players[0].step > 2) {
                                gameData.players[0].step = 0;
                            }
                            if (gameData.players[0].positionX < gameData.canvas.width - 200 - 6) {
                                gameData.players[0].positionX += gameData.stepSize * 2;
                            } else {
                                gameData.players[0].positionX = gameData.canvas.width - 200;
                                gameData.players[0].step = 0;
                                gameData.players[0].status = 'winner';
                            }
                        }
                    }
                    if (frame % 2 == 0) {
                        gameData.fireworkStep++;
                    }
                    if (gameData.fireworkStep > 8) {
                        gameData.fireworkStep = 0;
                        gameData.fireworkCount++;
                    }
                    if (gameData.creditsPosition < 70) {

                        gameData.creditsPosition += gameData.creditsStep;
                        gameData.creditsStep += 2;
                    }
                    if (gameData.fireworkCount > 7) {
                        if (!firefox && !iOS) {
                            sounds['winner'].currentTime = 0;
                            sounds['winner'].pause();
                            clearTimeout(winnerTimer);
                            winnerTimer = null;
                        }
                        gameData.gameStatus = 'won';
                    }
                } else {
                    gameData.gameStatus = 'prelost';
                }
                gameData.snowPositionY += 1;
                if (gameData.snowPositionY >= 0) {
                    gameData.snowPositionY -= 410;
                }
            } else if (gameData.gameStatus == 'won') {
                if (frame % 8 == 0) {
                    gameData.smokeStep++;
                }
                if (gameData.smokeStep > 6) {
                    gameData.smokeStep = 0;
                }
                gameData.snowPositionY += 1;
                if (gameData.snowPositionY >= 0) {
                    gameData.snowPositionY -= 410;
                }
            } else if (gameData.gameStatus == 'prelost') {
                var player = gameData.players[gameData.winner];
                if (player.status == 'walking') {
                    if (frame % 3 == 0) {
                        player.step++;
                        if (player.step > 2) {
                            player.step = 0;
                        }
                        if (player.positionX < gameData.canvas.width - 200 - 15) {
                            player.positionX += gameData.stepSize * 5;
                        } else {
                            player.step = 0;
                            player.positionX = gameData.canvas.width - 200
                            player.status = 'winner';
                        }
                    }

                }
                if (frame % 8 == 0) {
                    gameData.smokeStep++;
                }
                if (gameData.smokeStep > 6) {
                    gameData.smokeStep = 0;
                }
                gameData.lostStep++;
                if (gameData.lostStep > 20) {
                    gameData.gameStatus = 'lost';
                }
                gameData.snowPositionY += 1;
                if (gameData.snowPositionY >= 0) {
                    gameData.snowPositionY -= 410;
                }
            } else if (gameData.gameStatus == 'lost') {
                if (frame % 8 == 0) {
                    gameData.smokeStep++;
                }
                if (gameData.smokeStep > 6) {
                    gameData.smokeStep = 0;
                }
            }
            for (p = 0; p < gameData.players.length; ++p) {
                player = gameData.players[p];
                if (gameData.maxPlayerPosition < gameData.players[p].positionX) {
                    gameData.maxPlayerPosition = gameData.players[p].positionX;
                }
                //console.log(gameData.canvas.width - gameData.maxPlayerPosition);
            }
            drawStage(gameData.canvas, gameData.context);
            frame++;
        },
        50);
}