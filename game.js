let socket;
let currentPlayer;
let game;

function joinGame() {
    const username = document.getElementById('username').value;
    const worldName = document.getElementById('world').value;
    
    if (!username) {
        alert('Please enter a username!');
        return;
    }
    
    // Hide login screen
    document.getElementById('login-screen').style.display = 'none';
    
    // Connect to server
    socket = io('http://localhost:3000');
    
    // Initialize game
    initGame(username, worldName);
}

function initGame(username, worldName) {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    game = new Phaser.Game(config);
    
    function preload() {
        // Load assets
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('dirt', 'assets/dirt.png');
        this.load.image('grass', 'assets/grass.png');
        this.load.image('stone', 'assets/stone.png');
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 32,
            frameHeight: 48
        });
        
        // Join world
        socket.emit('joinWorld', { username, worldName });
    }
    
    function create() {
        // Create world
        this.add.image(400, 300, 'sky');
        
        // Listen for world data
        socket.on('worldData', (data) => {
            // Create blocks
            data.blocks.forEach(block => {
                createBlock(block.x * 32, block.y * 32, block.type);
            });
            
            // Create current player
            currentPlayer = this.physics.add.sprite(100, 100, 'player');
            currentPlayer.setBounce(0.2);
            currentPlayer.setCollideWorldBounds(true);
            
            // Create other players
            data.players.forEach(playerData => {
                if (playerData.username !== username) {
                    createOtherPlayer(playerData);
                }
            });
        });
        
        // Listen for other players
        socket.on('playerJoined', (playerData) => {
            createOtherPlayer(playerData);
        });
        
        socket.on('playerMoved', (data) => {
            const otherPlayer = this.otherPlayers[data.username];
            if (otherPlayer) {
                otherPlayer.setPosition(data.x, data.y);
            }
        });
        
        socket.on('blockPlaced', (data) => {
            createBlock(data.x * 32, data.y * 32, data.blockType);
        });
        
        // Create animations
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'turn',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 20
        });
        
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.otherPlayers = {};
    }
    
    function update() {
        if (!currentPlayer) return;
        
        let velocityX = 0;
        
        if (this.cursors.left.isDown) {
            velocityX = -160;
            currentPlayer.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            velocityX = 160;
            currentPlayer.anims.play('right', true);
        } else {
            velocityX = 0;
            currentPlayer.anims.play('turn');
        }
        
        if (this.cursors.up.isDown && currentPlayer.body.touching.down) {
            currentPlayer.setVelocityY(-330);
        }
        
        currentPlayer.setVelocityX(velocityX);
        
        // Send position to server
        socket.emit('playerMove', {
            username: username,
            x: currentPlayer.x,
            y: currentPlayer.y,
            world: worldName
        });
        
        // Block placement on click
        if (this.input.activePointer.isDown) {
            const x = Math.floor(this.input.activePointer.worldX / 32);
            const y = Math.floor(this.input.activePointer.worldY / 32);
            socket.emit('placeBlock', {
                worldName: worldName,
                x: x,
                y: y,
                blockType: 'stone'
            });
        }
    }
    
    function createBlock(x, y, type) {
        const block = game.scene.scenes[0].physics.add.staticImage(x + 16, y + 16, type);
        game.scene.scenes[0].physics.add.collider(currentPlayer, block);
    }
    
    function createOtherPlayer(playerData) {
        const otherPlayer = game.scene.scenes[0].physics.add.sprite(
            playerData.x,
            playerData.y,
            'player'
        );
        otherPlayer.setTint(0xff0000); // Different color for other players
        game.scene.scenes[0].otherPlayers[playerData.username] = otherPlayer;
    }
}
