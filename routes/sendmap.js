const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const sendMap = Router();



sendMap.get( '/', (req, res) => {
    // Load gamedata to send to player
    let gameMap = fs.readFileSync(path.join(__dirname, '../gamedata/gamemap.json'), 'utf8');
    let structureTemplates = fs.readFileSync(path.join(__dirname, '../gamedata/structureTemplates.json'), 'utf8');
    let unitTemplates = fs.readFileSync(path.join(__dirname, '../gamedata/unitTemplates.json'), 'utf8');
    let player = fs.readFileSync(path.join(__dirname, '../gamedata/player.json'), 'utf8');
    let armyList = fs.readFileSync(path.join(__dirname, '../gamedata/armyList.json'), 'utf8');
    let buildOrders = fs.readFileSync(path.join(__dirname, '../gamedata/buildOrders.json'), 'utf8');

    let gameStatus = {
        gameMap: JSON.parse(gameMap),
        structureTemplates: JSON.parse(structureTemplates),
        unitTemplates: JSON.parse(unitTemplates),
        player: JSON.parse(player),
        armyList: JSON.parse(armyList),
        buildOrders: JSON.parse(buildOrders)
    }

    res.json(gameStatus);
});

module.exports = sendMap;