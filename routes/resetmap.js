const { Router } = require('express');
const fs = require('fs');
const path = require('path');

const resetMap = Router();

resetMap.post('/', (req, res) => {
    // Load and save New Game map
    fs.writeFileSync( 
        path.join(__dirname, '../gamedata/gamemap.json'),
        fs.readFileSync(path.join(__dirname, '../gamedata/newGame/gamemap.json'), 'utf8'),
        (err) => {
            console.log(err);
        }
    );

    // structureTemplates and unitTemplates should not have changed

    // Load and save New Game player
    fs.writeFileSync( 
        path.join(__dirname, '../gamedata/player.json'),
        fs.readFileSync(path.join(__dirname, '../gamedata/newGame/player.json'), 'utf8'),
        (err) => {
            console.log(err);
        }
    );

    // Load and save New Game armyList
    fs.writeFileSync( 
        path.join(__dirname, '../gamedata/armyList.json'),
        fs.readFileSync(path.join(__dirname, '../gamedata/newGame/armyList.json'), 'utf8'),
        (err) => {
            console.log(err);
        }
    );

    // Load and save New Game buildOrders
    fs.writeFileSync( 
        path.join(__dirname, '../gamedata/buildOrders.json'),
        fs.readFileSync(path.join(__dirname, '../gamedata/newGame/buildOrders.json'), 'utf8'),
        (err) => {
            console.log(err);
        }
    );

    // Log and send the success message
    res.json({msg: "Game state reset"});
    console.log("Game state reset");
});

module.exports = resetMap;