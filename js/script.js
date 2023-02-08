const jsonFile = 'data.json';
let jsonData = {};

$(window).on("load", function () {
	readJson();
	$(".sortable-list").sortable({
		axis: "y",
		containment: $("#table-wrapper"),
		create: function (event, ui) { update(); },
		deactivate: function (event, ui) { update(); }
	});

	initialize();
});

function initialize() {
	$("input").off("click");
	$("input").on("click", function () { update(); });

	$("input").off("keypress");
	$("input").on("keypress", function (e) {
		if (e.keyCode == 13) update();
	})

	$("#add-row-button").off("click");
	$("#add-row-button").on("click", function () { addRow(); });

	$("#save-button").off("click");
	$("#save-button").on("click", function () { saveJson(); downloadJsonFile(); });

	$("#update-button").off("click");
	$("#update-button").on("click", function () { saveJson(); updateJsonFile(); });

	update()
}

function update() {
	updateConsole();
	updateTable();
}

function updateConsole() {
	$console = $(".console-space");
	$console.text("");
	$(".sortable-list").children().each(function () {
		// each内でreturn trueをするとContinue
		if (!$(this).find("[data-type='enabled']").is(":checked")) {
			return true;
		}
		command = $(this).find("[data-type='command']").val();
		if ($("#is-output-file").is(":checked")) {
			command += " >> " + $("#output-file-name").val();

		}
		$console.html($console.html() + command + "<br>");
	})
}

function updateTable() {
	let index = 1
	$(".row").each(function () {
		let $id = $(this).find("[data-type='id']");
		let $checked = $(this).find("[data-type='enabled']");
		let $title = $(this).find("[data-type='title']");
		let $command = $(this).find("[data-type='command']");

		$(this).data("id", index);
		$(this).data("enabled", $checked.is(":checked"));
		$(this).data("title", $title.val());
		$(this).data("command", $command.val());
		$id.text(index);
		index += 1;
	});
}

function addRow() {
	let id = $(".row").length + 1
	var tr =
		`<tr data-id="${id}" data-enabled="true" class="row">
			<th data-type="id" class="row">${id}</th>
			<td><input type="checkbox" data-type="enabled" checked></td>
			<td><input type="textbox" data-type="title"></td>
			<td><input type="textbox" data-type="command"></td>
		`
	$(tr).appendTo($(".sortable-list"));
	initialize();
	return;
}

function saveJson() {
	let jsonItem = tableToDict();
	jsonData.items.forEach(function (item, index) {
		if (item.os == "RHEL8.6") {
			jsonData.items[index] = jsonItem;
			// return falseでforEachから break;
			return false;
		}
	})
}

function tableToDict() {
	let dict = {};
	dict["os"] = "RHEL8.6"

	let commands = [];
	$("#command-table").find(".row").each(function () {
		let rowData = $(this).data();
		let data = {
			"id":rowData.id,
			"enabled":rowData.enabled,
			"title":rowData.title,
			"command":rowData.command
		}
		commands.push(data);
	});
	dict["commands"] = commands;
	return dict;
}

function readJson() {
	$.getJSON(jsonFile)
	.then(function(json){
		jsonData = json;
		for (const item of jsonData.items) {
			if (item.os == "RHEL8.6") {
				var index = 1;
				for (const command of item.commands) {
					var tr =
						`<tr data-id="${command.id}" data-enabled=${command.enabled} data-title="${command.title}" data-command="${command.command}" class="row">
					<th data-type="id">${command.id}</th>
					<td><input type="checkbox" data-type="enabled" ${command.enabled ? "checked" : ""}></td>
					<td><input type="textbox" data-type="title" value="${command.title}"></td>
					<td><input type="textbox" data-type="command" value="${command.command}"></td>
				`
					$(tr).appendTo($(".sortable-list"));
					index += 1;
				}
			}
		}
		initialize();
	});
	return;
}


function downloadJsonFile(){
	const blob = new Blob([JSON.stringify(jsonData)]);

	const link = document.createElement('a');
	link.download = 'data.json';
	link.href = URL.createObjectURL(blob);
	link.click();
}


async function updateJsonFile(){

	[fileHandle] = await window.showOpenFilePicker({types:[{accept:{"text/json":[".json"]}}]});
	const file = await fileHandle.getFile();
	// const fileContents = await file.text();
	const writable = await fileHandle.createWritable();
	// jsonData = "test"
	await writable.write(JSON.stringify(jsonData));
	// await writable.write(jsonData);
	await writable.close();
}

function toast(msg) {

	$.toast({
		text: msg,
		showHideTransition: 'slide',
		icon: 'success',
		bgColor: '#0B610B',
		loderBg: 'green',
		textColor: 'white',
		allowToastClose: false,
		hideAfter: 2500,
		stack: 5,
		textAlign: 'left',
		position: 'top-right'
	});
}