const { Router } = require('express');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');

const receiveOrders = Router();

receiveOrders.get('/', (req, res) => {
    //console.log("GET received");
    res.json({ msg: "GET request processed" });
});

receiveOrders.post('/', (req, res) => {
    const allOrders = req.body;

    // Save build orders
    fs.writeFileSync(path.join(__dirname, '../gamedata/buildOrders.json'), JSON.stringify(allOrders.buildOrders), 'utf8', (err) => {
        console.log(err);
    });

    // Process and Save army orders
    let playerArmyList = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/armyList.json'), 'utf8'));
    const newArmyList = allOrders.armyList;

    for (let armyId in newArmyList) {
        // Skip newly created armies
        if (newArmyList[armyId].id.includes('placeholder')) {
            continue;
        }

        playerArmyList[armyId].generalOrders = newArmyList[armyId].generalOrders;
        playerArmyList[armyId].waypoints = newArmyList[armyId].waypoints;
    }

    // Process Immediate Orders - createArmy and disbandArmy
    let gameMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../gamedata/gamemap.json'), 'utf8'));
    

    allOrders.immediateOrders.forEach((order) => {
        let homeGarrison = gameMap.tileMap[order.tileX][order.tileY].garrison;
        // Process the createArmy order
        if (order.type === "createArmy") {
            // Make sure an army doesn't already exist at that location
            if (gameMap.tileMap[order.tileX][order.tileY].armyId != "") {
                // TODO: add a notification
                console.log("Army already exists here");
                return;
            }

            // Check if the garrison exists
            if (homeGarrison === null) {
                //TODO: add a notification, for now just skip the order
                console.log("No garrison here");
                return;
            }

            // Create the army and add it to the Army List
            let newArmyId = uuid.v4();
            let newArmyData = newArmyList[order.armyId];

            // Create the new army
            playerArmyList[newArmyId] = {
                "id": newArmyId,
                "name": order.armyName,
                "xPos": order.tileX,
                "yPos": order.tileY,
                "unitList": {},
                "owner": newArmyData.owner, // TODO: Get owner from player credentials
                "disorder": 0,
                "burden": 0,
                "burdenThreshold": 4,
                "burdenModifier": 0,
                "numUnits": 0,
                "trueSpeed": 0,
                "maxSpeed": 1000,
                "avgSpeed": 0,
                "generalOrders": newArmyData.generalOrders,
                "waypoints": newArmyData.waypoints
            };

            // Assign a reference
            let newArmy = playerArmyList[newArmyId];

            // First element of waypoinst must be army's position
            newArmy.waypoints[0] = {
                "x": order.tileX,
                "y": order.tileY
            };

            // Move the units from the garrison to the army
            order.armyArray.forEach((unitId) => {
                newUnit = homeGarrison.unitList[unitId];

                if (!newUnit) {
                    // Unit doesn't exist in the garrison
                    console.log("No unit " + unitId + " here");
                    return;
                }

                // Process burden and speed changes
                newArmy.burden += newUnit.bulk;
                if (newArmy.burden > newArmy.burdenThreshold) {
                    // The burden modifer is logarithmically related to burden
                    newArmy.burdenModifier += 1;
                    newArmy.burdenThreshold *= 2;
                }

                // Army cannot move faster than the slowest unit
                if (newUnit.speed < newArmy.maxSpeed) {
                    newArmy.maxSpeed = newUnit.speed;
                }

                // Recalculate the Army's average speed
                let totalSpeed = newArmy.avgSpeed * newArmy.numUnits;
                totalSpeed += newUnit.speed;
                newArmy.avgSpeed = totalSpeed / (newArmy.numUnits + 1);

                newArmy.numUnits += 1;

                // Add the unit to the army and remove it from the garrison
                newArmy.unitList[unitId] = newUnit;
                delete homeGarrison.unitList[unitId];
            });

            // If the army has no units, remove it
            if (Object.keys(newArmy.unitList) === 0) {
                delete playerArmyList[newArmyId];
            } else {
                // Add the army to the map
                gameMap.tileMap[order.tileX][order.tileY].armyId = newArmy.id;
            }
        }

        // Process the disbandArmy order
        if (order.type === "disbandArmy") {
            let targetArmy = playerArmyList[order.armyId];

            // Check that the target army exists
            if (!targetArmy) {
                // TODO: Create a notification
                console.log("No such army " + order.armyId);
                return;
            }

            // Make sure the garrison exists and is at the same location
            if (homeGarrison != null &&
                targetArmy.xPos == homeGarrison.xPos &&
                targetArmy.yPos == homeGarrison.yPos) {

                for (let unitId in targetArmy.unitList) {
                    // Make sure the unit exists in the army
                    if (!targetArmy.unitList[unitId]) {
                        continue;
                    }
                    homeGarrison.unitList[unitId] = targetArmy.unitList[unitId];
                }

                homeGarrison.disbandedArmyName = targetArmy.name;
                delete playerArmyList[order.armyId];

                // Remove the army from the map
                gameMap.tileMap[order.tileX][order.tileY].armyId = "";
            } else {
                // TODO: Create a notification for the error
                console.log("Army is not at a garrison");
            }
        }
    });

    // Save the army list and map
    fs.writeFileSync(path.join(__dirname, '../gamedata/armyList.json'), JSON.stringify(playerArmyList), 'utf8', (err) => {
        console.log(err);
    });
    fs.writeFileSync(path.join(__dirname, '../gamedata/gamemap.json'), JSON.stringify(gameMap), 'utf8', (err) => {
        console.log(err);
    });

    // Log and send the success message
    console.log('New orders received');
    res.json({ msg: 'New orders received' });
});

module.exports = receiveOrders;