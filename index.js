/*Bernkastel*/
/*Credits Pinky for base code*/

const CONTRACT_DRESSING_ROOM = 76,
    Command = require('command')

module.exports = function zCostumeEx(dispatch) {
	const command = Command(dispatch), 
	    path = require('path'),
	    fs = require('fs');
	
	let player,
        userDefaultAppearance,
        gameId = null,
        external = null,
		itemType = null,
		isCostume = false,
		isInnerwear = false,
		inDye = false,
        inDressup = false,
        presets = {},
        presetTimeout = null,
        presetLock = false,
        tagged = {},
        taggedTimeout = null,
        taggedLock = false;
		
////////////////////////////////////////

    try {
		presets = require('./presets.json');
        tagged = require('./tags.json'); 
	} catch(e) {
		presets = {};
		tagged = {};
	}
	
	function presetUpdate() {
	    clearTimeout(presetTimeout);
	    presetTimeout = setTimeout(presetSave, 1000);
	}
	
	function presetSave() {
		if(presetLock) {
			presetUpdate();
			return;
		}
		
		presetLock = true;
		fs.writeFile(path.join(__dirname, 'presets.json'), JSON.stringify(presets), err => {
			presetLock = false;
		});
	}

    function taggedUpdate() {
		clearTimeout(taggedTimeout);
		taggedTimeout = setTimeout(taggedSave, 1000);
	}

    function taggedSave() {
		if(taggedLock) {
			taggedUpdate();
			return;
		}
		
		taggedLock = true;
		fs.writeFile(path.join(__dirname, 'tags.json'), JSON.stringify(tagged), err => {
			taggedLock = false;
		});
	}
	
	function AppearanceUpdate() {
		dispatch.toClient('S_USER_EXTERNAL_CHANGE', 5, external);
		if(tagged[player]){
			dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
		}
		presets[player] = external;
		presetUpdate();
	}

////////////////////////////////////////

	dispatch.hook('S_LOGIN', 9, event => {
		gameId = event.gameId;
		player = event.name;
		inDressup = false;
		if(presets[player] && presets[player].id != 0){
			external = presets[player];
			external.gameId = gameId;
		}
	});
	
	dispatch.hook('S_GET_USER_LIST', 12, (event) => {
        for (let index in event.characters) {
            if(presets[event.characters[index].name] && presets[event.characters[index].name].id != 0){
                event.characters[index].styleHead = presets[event.characters[index].name].styleHead;
                event.characters[index].styleFace = presets[event.characters[index].name].styleFace;
				event.characters[index].styleBack = presets[event.characters[index].name].styleBack;
				event.characters[index].styleWeapon = presets[event.characters[index].name].styleWeapon;
				event.characters[index].weaponEnchant = presets[event.characters[index].name].weaponEnchant;
				event.characters[index].styleBody = presets[event.characters[index].name].styleBody;
				event.characters[index].styleFootprint = presets[event.characters[index].name].styleFootprint;
				event.characters[index].styleBodyDye = presets[event.characters[index].name].styleBodyDye;
            }
        }
        return true;
    });

	dispatch.hook('S_USER_EXTERNAL_CHANGE', 5, event => {
		if(event.gameId.equals(gameId)) {
				userDefaultAppearance = Object.assign({}, event);
		if(presets[player] && presets[player].id != 0){
			AppearanceUpdate();
			if(external.weaponDye == 1){
			dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
				target: gameId,
				source: 0,
				id: 7000027,
				duration: 0,
				unk: 0,
				stacks: 1,
				unk2: 0,
			});
			}
			return false;
		}
		else{
			external = Object.assign({}, event);
			presets[player] = Object.assign({}, external);
			presets[player].id = 0;
			presetUpdate();
		}
		}
	});
	
	dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
		if(presets[player] && presets[player].id != 0 && external.weaponDye == 0 && event.id == 7000027){
			dispatch.toClient('S_ABNORMALITY_END', 1, {
				target: gameId,
				id: 7000027,
			})
		}
		// Ragnarok Fix
		if(event.id == 10155130){
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 5, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
		}
	});
	
	// Ragnarok Fix
	dispatch.hook('S_ABNORMALITY_END', 1, (event) =>{
		if(event.target.low != gameId.low || event.target.high != gameId.high || event.target.unsigned != gameId.unsigned){
			return;
		}
		if(event.id == 10155130){
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 5, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
		}
	});
	
	 // Disable Marrow Brooch apearance change - Credits Kourinn
    dispatch.hook('S_UNICAST_TRANSFORM_DATA', 'raw', (code, data) => {
        return false
    });
	
	dispatch.hook('C_ITEM_COLORING_SET_COLOR', 1, (event) => {
		var color = Number('0x'+event.alpha.toString(16)+event.red.toString(16)+event.green.toString(16)+event.blue.toString(16));
		if(isCostume){
			external.styleBodyDye = color;
			isCostume = false;
		}
		if(isInnerwear){
			external.underwearDye = color;
			isInnerwear = false;
		}
		presets[player] = external;
		presetUpdate();
	});
	
	dispatch.hook('C_CANCEL_CONTRACT', 1, event => {
		if(inDye){
			inDye = false;
			AppearanceUpdate();
		}
	});
		
	dispatch.hook('S_REQUEST_CONTRACT', 1, event => {
		if(event.type == CONTRACT_DRESSING_ROOM){
			inDressup = true;
		}
	});
	
	dispatch.hook('S_CANCEL_CONTRACT', 1, event => {
		if(inDressup){
			inDressup = false;
			AppearanceUpdate(); 
		}
	});
	
////////////////////////////////////////
		
	command.add('enchant', (value) => {
		external.weaponEnchant = value;
        AppearanceUpdate();
	})
	
	command.add('tag', (value) => {
		tagged[player] = value;
		if(tagged[player]){
			dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
		}
		taggedUpdate();
	})
	
	command.add('dye', (type) => {
		switch (type) {
			case 'costume':
			    itemType = external.styleBody;
				isCostume = true;
				inDye = true;
				break;
			case 'inner':
			    itemType = external.underwear;
				isInnerwear = true;
				inDye = true;
				break;
		}
		dispatch.toClient('S_REQUEST_CONTRACT', 1, {
			senderId: gameId,
			recipientId: 0,
			type: 42,
			id: 999999,
			unk3: 0,
			time: 0,
			senderName: player,
			recipientName: '',
			data: '',
		});
		dispatch.toClient('S_ITEM_COLORING_BAG', 1, {
			unk: 40,
			unk1: 593153247,
			unk2: 0,
			item: itemType,
			unk3: 0,
			dye: 169087,
			unk4: 0,
			unk5: 0,
		});
	})
	
	command.add('undye', () => {
		external.styleBodyDye = 0;
		external.underwearDye = 0;
		AppearanceUpdate(); 
	})
	
	command.add('use', (type, value) => {
		switch (type) {
			case "weapon":
                external.styleWeapon = value;
                break;
            case "costume":
                external.styleBody = value;
                break;
            case "head":
                external.styleHead = value;
                break;
            case "face":
                external.styleFace = value;
                break;
            case "back":
                external.styleBack = value;
                break;
            case "footstep":
                external.styleFootprint = value;
                break;
            case "inner":
                external.underwear = value;
                break;
		}
		AppearanceUpdate();
	})
	
	command.add('pantsu', () => {
		if(external.weaponDye == 0){
			dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
				target: gameId,
				source: 0,
				id: 7000027,
				duration: 0,
				unk: 0,
				stacks: 1,
				unk2: 0,
			});
			external.weaponDye = 1;
			presets[player] = external;
			presetUpdate();
		}
		else if(external.weaponDye == 1){
			dispatch.toClient('S_ABNORMALITY_END', 1, {
				target: gameId,
				id: 7000027,
			});
			external.weaponDye = 0;
			presets[player] = external;
			presetUpdate();
		}
	})
	
	command.add('reset', () => {
		dispatch.toClient('S_USER_EXTERNAL_CHANGE', 5, userDefaultAppearance);
		tagged[player] = "";
		taggedUpdate();
		dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
		external = Object.assign({}, userDefaultAppearance);
		presets[player].id = 0;
		presetUpdate();
	})
	
}
