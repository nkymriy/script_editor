let jsonData = {};
let selectProfile;

$(window).on("load", function () {
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

	$("#read-button").off("click");
	$("#read-button").on("click", function () { readJsonFile(); });

	$("#update-button").off("click");
	$("#update-button").on("click", function () { saveJson(); updateJsonFile(); });

	$("#delete-profile-button").off("click");
	$("#delete-profile-button").on("click", function () { deleteProfile(); });

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
		let tmpCommand = "";
		let isOutputFile = $("#is-output-file").is(":checked");
		let row = $(this).data();
		// タイトルecho
		if (row.title && $("#is-output-title").is(":checked")) {
			tmpCommand += `${$("#echo-title-before").val()}${row.title}${$("#echo-title-after").val()}`
			// ファイル出力
			if (isOutputFile) {
				tmpCommand += " >> " + output_file;
			}
			command += tmpCommand.wrapHtmlTag("span");
		}

		// コマンドecho
		if (row.command && $("#is-echo-command").is(":checked")) {
			tmpCommand = `echo '${row.command}'`
			// ファイル出力
			if (isOutputFile) {
				tmpCommand += " >> " + output_file;
			}
			command += tmpCommand.wrapHtmlTag("span")
		}

		// コマンド取得
		if (row.command) {
			tmpCommand = $(this).find("[data-type='command']").val();
			// ファイル出力
			if (isOutputFile) {
				tmpCommand += " >> " + output_file;
			}
			command += tmpCommand.wrapHtmlTag("span")
		}

		// 最終行の場合に改行 or 次行にタイトルが入力されている場合に改行
		let nextRow = $(`[data-id='${row.id + 1}']`).data();
		if (!nextRow || nextRow && nextRow.title != "") {
			if ($("#is-after-newline").is(":checked")) {
				command += `\n`.wrapHtmlTag("span").repeat($("#after-newline-count").val());
			}
		}
		$console.html($console.html() + command);
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
	let isNewProfile = true;
	console.log(jsonItem);
	jsonData.items.forEach(function (item, index) {
		if (item.profileId == $("#profile-id").val()) {
			jsonData.items[index] = jsonItem;
			isNewProfile = false;
			// return falseでforEachから break;
			return false;
		}
	})

	if (isNewProfile) {
		jsonData.items.push(jsonItem);
	}
}

function tableToDict() {
	let dict = {};
	dict["profileId"] = $("#profile-id").val();
	dict["profileName"] = $("#profile-name").val();
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

async function readJsonFile() {
	[fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { "text/json": [".json"] } }] });
	const rowJsonFile = await fileHandle.getFile();
	jsonData = JSON.parse(await rowJsonFile.text());
	readJson();
}

function readJson() {
	let profiles = []
	// 先にProfileを埋める(1回だけ)
	for (const item of jsonData.items) {
		profiles.push(item.profileId);
		if ($(`#profile-list option[data-profile='${item.profileId}']`).length == 0) {
			$("#profile-list").append($(`<option data-profile='${item.profileId}'>`).html(`${item.profileId}:${item.profileName}`).val(item.profileId));
		}
	}

	let paramProfile = new URL(location.href).searchParams.get("profile");
	// Getparamで選択されていないか存在しない場合
	if (!paramProfile || !profiles.includes(paramProfile)) {
		history.replaceState("", "", `?profile=${profiles[0]}`);
		paramProfile = profiles[0];
	}

	for (const item of jsonData.items) {
		if (item.profileId == paramProfile) {
			selectProfile = item.profileId;
			// getパラメータを更新
			history.replaceState("", "", `?profile=${item.profileId}`);

			$("#profile-id").val(item.profileId);
			$("#profile-name").val(item.profileName);
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
	return;
}

function changeProfile() {
	let newProfile = $("#profile-list option:selected").val()
	history.replaceState("", "", `?profile=${newProfile}`);
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
	// [fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { "text/json": [".json"] } }] });
	// const file = await fileHandle.getFile();
	const writable = await fileHandle.createWritable();
	await writable.write(JSON.stringify(jsonData));
	await writable.close();
	toast("保存しました！");
}

function deleteRow(object) {
	object.parent().parent().remove();
}

function deleteProfile() {
	if (confirm("プロファイルを本当に削除してOK？") == false) return;

	// 指定されているIDの部分を削除
	jsonData.items.forEach(function (item, index) {
		if (item.profileId == $("#profile-id").val()) {
			jsonData.items.splice(index, 1);
		}
	})

	// 上書き保存させる
	updateJsonFile();
}

String.prototype.wrapHtmlTag = function (htmlTag) {
	return `<${htmlTag}>${this}</${htmlTag}>`;
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