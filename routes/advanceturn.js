const { Router } = require('express');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');

const advanceTurn = Router();

advanceTurn.post('/', (req, res) => {
    // Process advance turn request
    // Load gamedata to process the turn
    let gameMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/gamemap.json'), 'utf8'));
    let structureTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/structureTemplates.json'), 'utf8'));
    let unitTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/unitTemplates.json'), 'utf8'));
    let player = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/player.json'), 'utf8'));
    let armyList = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/armyList.json'), 'utf8'));
    let buildOrders = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/buildOrders.json'), 'utf8'));

    // Process Build Orders
    buildOrders.forEach( (order) => {
        switch (order.type) {
            case 'claimTile':
                // Check costs
                if( player.labor < 3 ||
                    player.resources['food'] < 3 ||
                    player.resources['wood'] < 2
                ) {
                    // TODO: create notification
                    break;
                }

                // Assign costs
                player.labor -= 3;
                player.resources['food'] -= 3;
                player.resources['wood'] -= 2;

                // Assign the tile
                gameMap.tileMap[order.tileX][order.tileY].owner = player.name;

                break;
            case 'buildRoad':
                // Check costs
                if( player.labor < 5 ||
                    player.resources.food < 5 ||
                    player.resources.wood < 3 ||
                    player.resources.stone < 5
                ) {
                    // TODO: create notification
                    break;
                }

                // Assign costs
                player.labor -= 5;
                player.resources.food -= 5;
                player.resources.wood -= 3;
                player.resources.stone -= 5;

                // Build the road
                gameMap.tileMap[order.tileX][order.tileY].road = true;

                break;
            case 'improveQuality':
                // Tile Quality is not yet in the game
                // so do nothing
                break;
            case 'buildStructure':
                let newStructure = structureTemplates[order.buildId];
                // Check costs
                let canAfford = true;
                for (const resource in newStructure.buildCost) {
                    if( player.resources[resource] < newStructure.buildCost[resource]) {
                        canAfford = false;
                    }
                }

                if (player.labor < newStructure.laborCost ||
                    !canAfford
                ) {
                    // TODO: create notification
                    break;
                }

                // Assign costs
                player.labor -= newStructure.laborCost;
                for (const resource in newStructure.buildCost) {
                    player.resources[resource] -= newStructure.buildCost[resource];
                }

                // Add the structure to the tile
                gameMap.tileMap[order.tileX][order.tileY].structure = {
                    "name": newStructure.name,
                    "id": "none",
                    "description": newStructure.description,
                    "terrains": [],
                    "buildCost": {},
                    "laborCost": 0
                };

                break;
            case 'trainUnit':
                // No costs to check yet
                // No costs to assign yet

                // Create the unit and add it to the garrison
                let currentGarrison = gameMap.tileMap[order.tileX][order.tileY].garrison;
                let templateUnit = unitTemplates[order.buildId];
                let newUnit = {
                    "id": uuid.v4(),
                    "name": templateUnit.name,
                    "meleeAttack": templateUnit.meleeAttack,
                    "missileAttack": templateUnit.missileAttack,
                    "meleeDefense": templateUnit.meleeDefense,
                    "missileDefense": templateUnit.missileDefense,
                    "maxCohesion": templateUnit.maxCohesion,
                    "cohesion": templateUnit.maxCohesion,
                    "speed": templateUnit.speed,
                    "bulk": templateUnit.bulk,
                    "buildCost": {},
                    "upkeepCost": {}
                }

                for( const resource in templateUnit.buildCost) {
                    newUnit.buildCost[resource] = templateUnit.buildCost[resource];
                }
                for( const resource in templateUnit.upkeepCost) {
                    newUnit.upkeepCost[resource] = templateUnit.upkeepCost[resource];
                }

                // Assign the unit to the garrison
                currentGarrison.unitList[newUnit.id] = newUnit;
                break;
            default:
                break;
        }
    });

    // Build orders should now be empty
    buildOrders = [];

    // Process Army Movement
    for (let armyId in armyList) {
        let currentArmy = armyList[armyId];

        // If there are no set waypoints, skip this army
        if (currentArmy.waypoints.length < 2) {
            continue;
        }

        let currentX = currentArmy.waypoints[0].x;
        let currentY = currentArmy.waypoints[0].y;
        let targetX = currentArmy.waypoints[1].x;
        let targetY = currentArmy.waypoints[1].y;

        let newX = currentX;
        let newY = currentY;

        // Determine direction of movement
        if (targetX > currentX) {
            newX++;
        }
        if (targetX < currentX) {
            newX--;
        }
        if (targetY > currentY) {
            newY++;
        }
        if (targetY < currentY) {
            newY--;
        }

        if (gameMap.tileMap[newX][newY].armyId == "") {
            // If the new tile is unoccupied, just move there

            // Leave the previous tile
            gameMap.tileMap[currentX][currentY].armyId = "";

            // Move to the new tile
            gameMap.tileMap[newX][newY].armyId = currentArmy.id;
            currentArmy.xPos = newX;
            currentArmy.yPos = newY;
            currentArmy.waypoints[0].x = newX;
            currentArmy.waypoints[0].y = newY;
        } else {
            // New tile is occupied so must move around
            let dX = newX - currentX;
            let dY = newY - currentY;

            if (dX == 0) {
                // Trying to move horizontally, move around diagonally
                if (gameMap.tileMap[newX+1][newY].armyId == "") {
                    newX++;
                } else if (gameMap.tileMap[newX-1][newY].armyId == "") {
                    newY--;
                } else {
                    // Path is blocked, so no movement
                    newY = currentY;
                }
            } else if (dY == 0) {
                // Trying to move vertically, move around diagonally
                if (gameMap.tileMap[newX][newY+1].armyId == "") {
                    newY++;
                } else if (gameMap.tileMap[newX][newY-1].armyId == "") {
                    newY--;
                } else {
                    // Path is blocked, so no movement
                    newX = currentX;
                } 
            } else {
                // Trying to move diagonally, move around horizontally or vertically
                if (gameMap.tileMap[currentX][newY].armyId == "") {
                    newX = currentX;
                } else if (gameMap.tileMap[newX][currentY].armyId == "") {
                    newY = currentY;
                } else {
                    // Path is blocked, so no movement
                    newX = currentX;
                    newY = currentY;
                }
            }

            // Leave the previous tile
            gameMap.tileMap[currentX][currentY].armyId = "";

            // Move to the new tile
            // If the new tile is the same as the old tile,
            //    clearing then replacing the armyId will keep everything
            //    as it was
            gameMap.tileMap[newX][newY].armyId = currentArmy.id;
            currentArmy.xPos = newX;
            currentArmy.yPos = newY;
            currentArmy.waypoints[0].x = newX;
            currentArmy.waypoints[0].y = newY;
        }

        // Finally, if we've reached a new waypoint, replace the 0th
        // waypoint (the current location) with the one we've reached
        if (currentArmy.waypoints[0].x == currentArmy.waypoints[1].x &&
            currentArmy.waypoints[0].y == currentArmy.waypoints[1].y ) {
                currentArmy.waypoints.shift();
            }
    }

    // Update player resources
    player.labor = player.maxLabor - player.spentLabor;
    player.resources.iron += 2;
    player.resources.wood += 5;
    player.resources.food += 5;
    player.resources.stone += 3;
    player.resources.leather += 3;
    player.resources.horses += 1;

    // Re-save all the game files
    fs.writeFileSync(path.join(__dirname, '../gamedata/gamemap.json'), JSON.stringify(gameMap), 'utf8', (err) => {
        console.log(err);
    });

    // No need to re-save structureTemplates or unitTemplates yet

    fs.writeFileSync(path.join(__dirname, '../gamedata/player.json'), JSON.stringify(player), 'utf8', (err) => {
        console.log(err);
    });
    fs.writeFileSync(path.join(__dirname, '../gamedata/armyList.json'), JSON.stringify(armyList), 'utf8', (err) => {
        console.log(err);
    });
    fs.writeFileSync(path.join(__dirname, '../gamedata/buildOrders.json'), JSON.stringify(buildOrders), 'utf8', (err) => {
        console.log(err);
    });

    // Log and send the success message
    res.json({msg: "Advance Turn processed"});
    console.log("Advance Turn processed");
});

module.exports = advanceTurn;