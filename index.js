/*Bernkastel*/
/*Credits Pinky for base code*/

const CONTRACT_DRESSING_ROOM = 76

module.exports = function zCostumeEx(dispatch) {
	
	let player;
	let userDefaultAppearance;

	let gameId = null,
		external = null,
		inDressup = false;
		
////////////////////////////////////////

const path = require('path');
fs = require('fs');

let presets = {};
let presetTimeout = null;
let presetLock = false;	

try { presets = require('./presets.json'); }
catch(e) { presets = {}; }

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

////////////////////////////////////////

let tagged = {};
let taggedTimeout = null;
let taggedLock = false;	

try { tagged = require('./tags.json'); }
catch(e) { tagged = {}; }

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

////////////////////////////////////////

	dispatch.hook('S_LOGIN', 9, event => {
		gameId = event.gameId
		player = event.name;
		inDressup = false
		if(presets[player] && presets[player].id != 0){
			external = presets[player];
			external.gameId = gameId;
		}
	})
	
	dispatch.hook('S_GET_USER_LIST', 11, (event) => {
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

	dispatch.hook('S_USER_EXTERNAL_CHANGE', 4, event => {
		if(event.gameId.equals(gameId)) {
				userDefaultAppearance = Object.assign({}, event);
		if(presets[player] && presets[player].id != 0){
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			presets[player] = external;
			presetUpdate();
			return false;
		}
		else{
			external = Object.assign({}, event);
			presets[player] = Object.assign({}, external);
			presets[player].id = 0;
			presetUpdate();
		}
		}
	})
	
	 // disable Marrow Brooch apearance change - Credits Kourinn
    dispatch.hook('S_UNICAST_TRANSFORM_DATA', 'raw', (code, data) => {
        return false
    })
	
	dispatch.hook('cChat', 1, (event) => {
		if(event.message.includes("dye1")){
			var str = event.message;
			str = str.replace("<FONT>", "");
			str = str.replace("</FONT>", "");
			str = str.split(" ");
			let z_hex = Math.min(Math.max(Number(str[4]),1),255).toString(16);
			let r_hex = Math.min(Math.max(Number(str[1]),16),255).toString(16);
			let g_hex = Math.min(Math.max(Number(str[2]),16),255).toString(16);
			let b_hex = Math.min(Math.max(Number(str[3]),16),255).toString(16);
			var color = Number('0x'+z_hex+r_hex+g_hex+b_hex);
			external.styleBodyDye = color;
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			presets[player] = external;
			presetUpdate();
			return false;
		}
		if(event.message.includes("weapon1")){
			var str = event.message;
			str = str.replace("<FONT>", "");
			str = str.replace("</FONT>", "");
			str = str.split(" ");
			external.weaponEnchant = str[1];
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			presets[player] = external;
			presetUpdate();
			return false;
		}
		if(event.message.includes("tag1")){
			var str = event.message;
			str = str.replace("<FONT>", "");
			str = str.replace("</FONT>", "");
			str = str.split(" ");
			tagged[player] = str[1];
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			taggedUpdate();
			return false;
		}
		if(event.message.includes("undye1")){
			external.styleBodyDye = 0;
			presets[player] = external;
			presetUpdate();
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			return false;
		}
		if(event.message.includes("use1")){
			var str = event.message;
			str = str.replace("<FONT>", "");
			str = str.replace("</FONT>", "");
			str = str.split(" ");
			if(str[1] == "weapon"){
				external.styleWeapon = str[2];
			}
			if(str[1] == "costume"){
				external.styleBody = str[2];
			}
			if(str[1] == "head"){
				external.styleHead = str[2];
			}
			if(str[1] == "face"){
				external.styleFace = str[2];
			}
			if(str[1] == "back"){
				external.styleBack = str[2];
			}
			if(str[1] == "footstep"){
				external.styleFootprint = str[2];
			}
			
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external);
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
			presets[player] = external;
			presetUpdate();
			return false;
		}
		if(event.message.includes("reset1")){
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, userDefaultAppearance);
			tagged[player] = "";
			taggedUpdate();
			dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			external = Object.assign({}, userDefaultAppearance);
			presets[player].id = 0;
			presetUpdate();
			return false;
		}
	});
		
	dispatch.hook('S_REQUEST_CONTRACT', 1, event => {
		if(event.type == CONTRACT_DRESSING_ROOM) {
			inDressup = true
		}
	})
	
	dispatch.hook('S_CANCEL_CONTRACT', 1, event => {
		if(inDressup) {
			inDressup = false
			process.nextTick(() => { dispatch.toClient('S_USER_EXTERNAL_CHANGE', 4, external) })
			presets[player] = external;
			presetUpdate();
			if(tagged[player]){
				dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, { gameId: gameId, customStrings: [{dbid: external.styleBody, string: tagged[player]}]});
			}
		}
	})

}
