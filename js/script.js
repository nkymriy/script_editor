const jsonFile = 'data.json';
let jsonData = {};
let selectProfile;

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

	$("input[data-command='delete']").off("click");
	$("input[data-command='delete']").on("click", function () { deleteRow($(this)); });

	$("#profile-list").off("change");
	$("#profile-list").on("change", function () { changeProfile() });
	update()
}

function update() {
	updateTable();
	updateConsole();
}

function updateConsole() {
	$console = $(".console-space");
	$console.text("");
	let output_file = $("#output-file-name").val();
	$(".sortable-list").children().each(function () {
		// each内でreturn trueをするとContinue
		if (!$(this).find("[data-type='enabled']").is(":checked")) {
			return true;
		}

		let command = "";
		let isOutputFile = $("#is-output-file").is(":checked");
		let row = $(this).data();
		// タイトルecho
		if (row.title && $("#is-echo-title").is(":checked")) {
			command += `echo '${$("#echo-title-before").val()}${row.title}${$("#echo-title-after").val()}'`
			// ファイル出力
			if (isOutputFile) {
				command += " >> " + output_file;
			}
			command += `<br>`
		}

		// コマンドecho
		if (row.command && $("#is-echo-command").is(":checked")) {
			command += `echo '${row.command}'`
			// ファイル出力
			if (isOutputFile) {
				command += " >> " + output_file;
			}
			command += `<br>`
		}

		// コマンド取得
		if (row.command) {
			command += $(this).find("[data-type='command']").val();
			// ファイル出力
			if (isOutputFile) {
				command += " >> " + output_file;
			}
		}

		// 最終行の場合に改行 or 次行にタイトルが入力されている場合に改行
		let nextRow = $(`[data-id='${row.id + 1}']`).data();
		if (!nextRow || nextRow && nextRow.title != "") {
			if ($("#is-after-newline").is(":checked")) {
				command += `<br>`.repeat($("#after-newline-count").val());
			}
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
			<th data-type="id">${id}</th>
			<td><input type="checkbox" data-type="enabled" checked></td>
			<td><input type="textbox" data-type="title"></td>
			<td><input type="textbox" data-type="command"></td>
			<td><input type="button" data-command="delete" value="X"></td>
		`
	$(tr).appendTo($(".sortable-list"));
	initialize();
	return;
}

function saveJson() {
	let jsonItem = tableToDict();
	console.log(jsonItem);
	jsonData.items.forEach(function (item, index) {
		if (item.profile == selectProfile) {
			jsonData.items[index] = jsonItem;
			// return falseでforEachから break;
			return false;
		}
	})
}

function tableToDict() {
	let dict = {};
	dict["profile"] = selectProfile;
	dict["os"] = $("#os-name").val();

	let commands = [];
	$("#command-table").find(".row").each(function () {
		let rowData = $(this).data();
		let data = {
			"id": rowData.id,
			"enabled": rowData.enabled,
			"title": rowData.title,
			"command": rowData.command
		}
		commands.push(data);
	});
	dict["commands"] = commands;
	return dict;
}

function readJson() {
	$.getJSON(jsonFile)
		.then(function (json) {
			jsonData = json;
			// 先にProfileを埋める(1回だけ)
			for (const item of jsonData.items) {
				if($(`#profile-list option[data-profile='${item.profile}']`).length == 0){
					$("#profile-list").append($(`<option data-profile='${item.profile}'>`).html(item.profile).val(item.profile));
				}

				// Getparamで選択されていない場合
				if(!new URL(location.href).searchParams.get("profile")){
					let profile = $("#profile-list option:selected").val();
					history.replaceState("","",`?profile=${profile}`);
				}
			}
		
			for (const item of jsonData.items) {
				let profile = new URL(location.href).searchParams.get("profile");

				if (item.profile == profile) {
					selectProfile = item.profile;

					// getパラメータを更新
					history.replaceState("","",`?profile=${item.profile}`);

					$("#os-name").val(item.os);
					var index = 1;
					for (const command of item.commands) {
						var tr =
							`<tr data-id="${command.id}" data-enabled=${command.enabled} data-title="${command.title}" data-command="${command.command}" class="row">
							<th data-type="id">${command.id}</th>
							<td><input type="checkbox" data-type="enabled" ${command.enabled ? "checked" : ""}></td>
							<td><input type="textbox" data-type="title" value="${command.title}"></td>
							<td><input type="textbox" data-type="command" value="${command.command}"></td>
							<td><input type="button" data-command="delete" value="X"></td>
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

function changeProfile(){
	let newProfile = $("#profile-list option:selected").val()
	history.replaceState("","",`?profile=${newProfile}`);
	// テーブルをクリア
	$(".row").remove();
	readJson();
}


function downloadJsonFile() {
	const blob = new Blob([JSON.stringify(jsonData)]);

	const link = document.createElement('a');
	link.download = 'data.json';
	link.href = URL.createObjectURL(blob);
	link.click();
}


async function updateJsonFile() {

	[fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { "text/json": [".json"] } }] });
	const file = await fileHandle.getFile();
	// const fileContents = await file.text();
	const writable = await fileHandle.createWritable();
	// jsonData = "test"
	await writable.write(JSON.stringify(jsonData));
	// await writable.write(jsonData);
	await writable.close();
}

function deleteRow(object) {
	object.parent().parent().remove();
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