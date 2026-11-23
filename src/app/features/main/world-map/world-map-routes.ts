export interface WorldMapRoutePoint {
    x: number;
    y: number;
}

type RouteKey = `${number}-${number}`;

// Coordinates use the same 0-2000 map space as the area API. Points are ordered
// from the lower area ID to the higher one; area coordinates are supplied at runtime.
const ROUTE_WAYPOINTS: Partial<Record<RouteKey, readonly WorldMapRoutePoint[]>> = {
    '1-30': [ // Abandoned Mines - Ignaroth
        { x: 190, y: 130 },
        { x: 155, y: 205 }, 
        { x: 130, y: 285 },
    ],
    '2-6': [ // Ancient Ruins - Calderas
        { x: 1390, y: 945 },
        { x: 1470, y: 915 },
    ],
    '2-22': [ // Ancient Ruins - Forgotten Woods
        { x: 1280, y: 900 },
        { x: 1220, y: 815 },
    ],
    '2-32': [ // Ancient Ruins - Lakeside Encampment
        { x: 1285, y: 1005 },
        { x: 1235, y: 1040 },
    ],
    '2-39': [ // Ancient Ruins - Midlake Meadows
        { x: 1320, y: 1040 },
        { x: 1320, y: 1120 },
    ],
    '3-4': [ // At the Full Mug Tavern - Bandits' Cave
        { x: 1260, y: 180 },
        { x: 1350, y: 140 },
    ],
    '3-11': [ // At the Full Mug Tavern - Drunkman Forest
        { x: 1235, y: 250 },
        { x: 1290, y: 310 },
    ],
    '3-29': [ // At the Full Mug Tavern - Hunters Post
        { x: 1195, y: 285 },
        { x: 1170, y: 380 },
    ],
    '3-55': [ // At the Full Mug Tavern - Traders' Encampment
        { x: 1160, y: 195 },
        { x: 1110, y: 175 },
    ],
    '5-10': [ // Blackmire - Deadman Den
        { x: 210, y: 1275 },
        { x: 160, y: 1295 },
    ],
    '5-45': [ // Blackmire - Riverside Woods
        { x: 345, y: 1260 },
        { x: 435, y: 1255 },
    ],
    '5-50': [ // Blackmire - The Black Forest
        { x: 255, y: 1170 },
        { x: 240, y: 1080 },
    ],
    '5-52': [ // Blackmire - The Mirantis Passage
        { x: 275, y: 1320 },
        { x: 280, y: 1400 },
    ],
    '6-7': [ // Calderas - Calderas Glade
        { x: 1510, y: 835 },
        { x: 1505, y: 755 },
    ],
    '6-8': [ // Calderas - Calderas Grassland
        { x: 1510, y: 965 },
        { x: 1500, y: 1055 },
    ],
    '6-20': [ // Calderas - Finingham
        { x: 1610, y: 950 },
        { x: 1710, y: 1070 },
        { x: 1790, y: 1200 },
    ],
    '7-57': [ // Calderas Glade - Valderum Woods
        { x: 1500, y: 625 },
        { x: 1495, y: 550 },
    ],
    '8-39': [ // Calderas Grassland - Midlake Meadows
        { x: 1450, y: 1155 },
        { x: 1385, y: 1185 },
    ],
    '9-22': [ // Cavern of Silence - Forgotten Woods
        { x: 1250, y: 685 },
        { x: 1200, y: 715 },
    ],
    '11-29': [ // Drunkman Forest - Hunters Post
        { x: 1280, y: 400 },
        { x: 1220, y: 450 },
    ],
    '11-57': [ // Drunkman Forest - Valderum Woods
        { x: 1380, y: 400 },
        { x: 1450, y: 450 },
    ],
    '12-13': [ // Faramh - Faramh Canals
        { x: 895, y: 575 },
        { x: 930, y: 615 },
    ],
    '12-14': [ // Faramh - Faramh Grassland
        { x: 825, y: 625 },
        { x: 820, y: 730 },
        { x: 810, y: 800 },
    ],
    '12-16': [ // Faramh - Faramh Wilderness
        { x: 820, y: 490 },
        { x: 810, y: 420 },
    ],
    '12-17': [ // Faramh - Faramh Woods
        { x: 785, y: 540 },
        { x: 710, y: 525 },
    ],
    '14-49': [ // Faramh Grassland - Southern Outpost
        { x: 770, y: 885 },
        { x: 725, y: 935 },
    ],
    '15-53': [ // Faramh Tunnels - The Riverside Tavern
        { x: 690, y: 850 },
        { x: 660, y: 1080 },
        { x: 625, y: 1280 },
    ],
    '16-42': [ // Faramh Wilderness - Northern Outpost
        { x: 785, y: 305 },
        { x: 775, y: 220 },
    ],
    '16-60': [ // Faramh Wilderness - Pinterthon
        { x: 755, y: 335 },
        { x: 675, y: 305 },
    ],
    '17-54': [ // Faramh Woods - The Rustling Forest
        { x: 615, y: 585 },
        { x: 610, y: 680 },
    ],
    '17-59': [ // Faramh Woods - Western Outpost
        { x: 565, y: 550 },
        { x: 495, y: 585 },
    ],
    '17-60': [ // Faramh Woods - Pinterthon
        { x: 590, y: 450 },
        { x: 575, y: 355 },
    ],
    '18-35': [ // Far Meadows - Laram Exeteris Grassland
        { x: 1315, y: 1400 },
        { x: 1275, y: 1455 },
    ],
    '18-39': [ // Far Meadows - Midlake Meadows
        { x: 1340, y: 1330 },
        { x: 1330, y: 1260 },
    ],
    '19-41': [ // Far Plateau - Monastery Ruins
        { x: 390, y: 360 },
        { x: 405, y: 280 },
    ],
    '19-59': [ // Far Plateau - Western Outpost
        { x: 395, y: 485 },
        { x: 410, y: 545 },
    ],
    '20-21': [ // Finingham - Finingham Glade
        { x: 1840, y: 1290 },
        { x: 1850, y: 1230 },
    ],
    '20-24': [ // Finingham - Gordium
        { x: 1785, y: 1430 },
        { x: 1715, y: 1535 },
    ],
    '22-29': [ // Forgotten Woods - Hunters Post
        { x: 1155, y: 660 },
        { x: 1155, y: 565 },
    ],
    '22-40': [ // Forgotten Woods - Midlake Wilderness
        { x: 1120, y: 790 },
        { x: 1060, y: 870 },
        { x: 1020, y: 930 },
    ],
    '23-46': [ // Fort Mirantis - Seaside Wilderness
        { x: 270, y: 1730 },
        { x: 350, y: 1780 },
    ],
    '23-52': [ // Fort Mirantis - The Mirantis Passage
        { x: 240, y: 1640 },
        { x: 270, y: 1560 },
    ],
    '24-26': [ // Gordium - Gordium Wilderness
        { x: 1580, y: 1635 },
        { x: 1530, y: 1610 },
    ],
    '24-33': [ // Gordium - Laram Exeteris
        { x: 1480, y: 1640 },
        { x: 1330, y: 1615 },
        { x: 1175, y: 1590 },
    ],
    '25-26': [ // Gordium Old Fort Ruins - Gordium Wilderness
        { x: 1570, y: 1440 },
        { x: 1530, y: 1510 },
    ],
    '27-44': [ // Hermit's Tent - Riverside Forest
        { x: 690, y: 1720 },
        { x: 650, y: 1660 },
    ],
    '28-49': [ // Hoghmith - Southern Outpost
        { x: 475, y: 885 },
        { x: 565, y: 930 },
    ],
    '28-54': [ // Hoghmith - The Rustling Forest
        { x: 485, y: 825 },
        { x: 550, y: 790 },
    ],
    '28-59': [ // Hoghmith - Western Outpost
        { x: 420, y: 780 },
        { x: 425, y: 700 },
    ],
    '29-57': [ // Hunters Post - Valderum Woods
        { x: 1250, y: 475 },
        { x: 1380, y: 475 },
    ],
    '30-31': [ // Ignaroth - Ignaroth Wilderness
        { x: 115, y: 465 },
        { x: 125, y: 560 },
    ],
    '31-50': [ // Ignaroth Wilderness - The Black Forest
        { x: 155, y: 765 },
        { x: 195, y: 850 },
    ],
    '31-59': [ // Ignaroth Wilderness - Western Outpost
        { x: 200, y: 665 },
        { x: 300, y: 630 },
    ],
    '31-61': [ // Ignaroth Wilderness - Wolven Lair
        { x: 90, y: 680 },
        { x: 55, y: 675 },
    ],
    '33-34': [ // Laram Exeteris - Laram Exeteris Canals
        { x: 1040, y: 1625 },
        { x: 1080, y: 1660 },
    ],
    '33-35': [ // Laram Exeteris - Laram Exeteris Grassland
        { x: 1075, y: 1560 },
        { x: 1160, y: 1525 },
    ],
    '33-36': [ // Laram Exeteris - Laram Exeteris Woods
        { x: 940, y: 1570 },
        { x: 870, y: 1555 },
    ],
    '33-38': [ // Laram Exeteris - Midlake Causeway
        { x: 1035, y: 1540 },
        { x: 1080, y: 1480 },
    ],
    '36-47': [ // Laram Exeteris Woods - Smugglers' Cavern
        { x: 875, y: 1510 },
        { x: 920, y: 1455 },
    ],
    '36-53': [ // Laram Exeteris Woods - The Riverside Tavern
        { x: 770, y: 1505 },
        { x: 690, y: 1445 },
    ],
    '37-38': [ // Midlake - Midlake Causeway
        { x: 1100, y: 1280 },
        { x: 1105, y: 1350 },
    ],
    '37-39': [ // Midlake - Midlake Meadows
        { x: 1165, y: 1205 },
        { x: 1245, y: 1200 },
    ],
    '37-40': [ // Midlake - Midlake Wilderness
        { x: 1060, y: 1150 },
        { x: 1030, y: 1075 },
    ],
    '37-51': [ // Midlake - The Broken Arrow Inn
        { x: 1035, y: 1195 },
        { x: 965, y: 1170 },
    ],
    '41-42': [ // Monastery Ruins - Northern Outpost
        { x: 500, y: 175 },
        { x: 600, y: 150 },
        { x: 690, y: 140 },
    ],
    '41-48': [ // Monastery Ruins - Sobbing Cave
        { x: 450, y: 150 },
        { x: 465, y: 100 },
    ],
    '42-55': [ // Northern Outpost - Traders' Encampment
        { x: 845, y: 135 },
        { x: 930, y: 140 },
        { x: 1000, y: 155 },
    ],
    '42-58': [ // Northern Outpost - Wanderer Grotto
        { x: 735, y: 100 },
        { x: 700, y: 70 },
    ],
    '43-57': [ // Pondbarrow - Valderum Woods
        { x: 1750, y: 520 },
        { x: 1645, y: 500 },
        { x: 1565, y: 490 },
    ],
    '44-46': [ // Riverside Forest - Seaside Wilderness
        { x: 560, y: 1665 },
        { x: 500, y: 1740 },
    ],
    '44-53': [ // Riverside Forest - The Riverside Tavern
        { x: 605, y: 1550 },
        { x: 610, y: 1475 },
    ],
    '45-49': [ // Riverside Woods - Southern Outpost
        { x: 560, y: 1190 },
        { x: 620, y: 1100 },
        { x: 670, y: 1040 },
    ],
    '45-53': [ // Riverside Woods - The Riverside Tavern
        { x: 555, y: 1285 },
        { x: 585, y: 1330 },
    ],
    '49-51': [ // Southern Outpost - The Broken Arrow Inn
        { x: 740, y: 1020 },
        { x: 810, y: 1090 },
        { x: 850, y: 1130 },
    ],
    '49-54': [ // Southern Outpost - The Rustling Forest
        { x: 675, y: 920 },
        { x: 650, y: 860 },
        { x: 620, y: 810 },
    ],
    '56-57': [ // Valderum - Valderum Woods
        { x: 1600, y: 305 },
        { x: 1550, y: 370 },
    ],
    '59-60': [ // Western Outpost - Pinterthon
        { x: 470, y: 535 },
        { x: 510, y: 440 },
    ],
};

export function getWorldMapRouteWaypoints(
    fromAreaId: number,
    toAreaId: number,
): readonly WorldMapRoutePoint[] {
    const key = `${Math.min(fromAreaId, toAreaId)}-${Math.max(fromAreaId, toAreaId)}` as RouteKey;
    const waypoints = ROUTE_WAYPOINTS[key] ?? [];

    return fromAreaId <= toAreaId ? waypoints : [...waypoints].reverse();
}
