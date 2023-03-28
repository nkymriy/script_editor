let jsonData = {};
let selectProfile;

$(window).on("load", function () {
	let clipboard = new ClipboardJS('.clip');
	clipboard.on('success', function(e) {
		toast("コピーしました！")
	});
	

	$(".extend-option-list").sortable({
		axis: "y",
		containment: $(".extend-option-table-wrapper"),
		create: function (event, ui) { update(); },
		deactivate: function (event, ui) { update(); }
	});

	$(".command-list").sortable({
		axis: "y",
		containment: $(".command-table-wrapper"),
		create: function (event, ui) { update(); },
		deactivate: function (event, ui) { update(); }
	});

	initialize();
});

/**
 * 初期化
 */
function initialize() {
	$("input").off("click");
	$("input").on("click", function () { update(); });

	$("input").off("keypress");
	$("input").on("keypress", function (e) {
		if (e.keyCode == 13) update();
	})

	$("#add-extend-option-button").off("click");
	$("#add-extend-option-button").on("click", function () { addExtendOptionRow(); });

	$("#add-command-button").off("click");
	$("#add-command-button").on("click", function () { addCommandRow(); });

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

/**
 * 画面更新
 */
function update() {
	updateTable();
	updateConsole();
	updateConsoleHeader();
}

/**
 * コンソール(画面右)表示更新
 */
function updateConsole() {
	$console = $(".console-space");
	$console.text("");
	let outputFile = $("#output-file-name").val();
	let extendOptions = [];

	// 拡張設定をリストに読み込む
	$(".extend-option-list").children().each(function () {
		let optionData = $(this).data();
		if (!optionData.enabled) {
			return true;
		}
		extendOptions.push(optionData);
	});

	$(".command-list").children().each(function () {
		// each内でreturn trueをするとContinue
		let row = $(this).data();
		if (!row.enabled) {
			return true;
		}

		let command = "";
		for (let extendOption of extendOptions) {
			if (row.ignoreExtendOption) {
				command += `${row.command}`.wrapHtmlTag("span");
				break;
			}
			// タイトル
			if (extendOption.enabledTitle && row.title) {
				command += `${extendOption.description.replace("${target}", row.title)}`.wrapHtmlTag("span");
			}
			// コマンド
			if (extendOption.enabledCommand && row.command) {
				command += `${extendOption.description.replace("${target}", row.command)}`.wrapHtmlTag("span");
			}
		};

		// 最終行の場合に改行 or 次行にタイトルが入力されている場合に改行
		let nextRow = $(`.command-row[data-id='${row.id + 1}']`).data();
		if (!nextRow || nextRow && nextRow.title != "") {
			if ($("#after-newline-count").val() > 0) {
				command += `\n`.wrapHtmlTag("span").repeat($("#after-newline-count").val());
			}
		}
		$console.html($console.html() + command);
	})
	$(".code > span").each(function () {
		updateCodeLine($(this));
	})
}

/**
 * テーブル(画面左)更新
 */
function updateTable() {
	// 拡張設定行
	let index = 1
	$(".extend-option-row").each(function () {
		let $id = $(this).find("[data-type='id']");
		let $enabled = $(this).find("[data-type='enabled']");
		let $name = $(this).find("[data-type='name']");
		let $description = $(this).find("[data-type='description']");
		let $enabledTitle = $(this).find("[data-type='enabledTitle']");
		let $enabledCommand = $(this).find("[data-type='enabledCommand']");

		$(this).data("id", index);
		$(this).attr("data-id", index);
		$id.text(index);
		$(this).data("enabled", $enabled.is(":checked"));
		$(this).data("name", $name.val());
		$(this).data("description", $description.val());
		$(this).data("enabledTitle", $enabledTitle.is(":checked"));
		$(this).data("enabledCommand", $enabledCommand.is(":checked"));
		index += 1;
	});

	// コマンド行
	index = 1
	$(".command-row").each(function () {
		let $id = $(this).find("[data-type='id']");
		let $enabled = $(this).find("[data-type='enabled']");
		let $ignoreExtendOption = $(this).find("[data-type='ignoreExtendOption']");
		let $title = $(this).find("[data-type='title']");
		let $command = $(this).find("[data-type='command']");

		$(this).data("id", index);
		$(this).attr("data-id", index);
		$id.text(index);
		$(this).data("enabled", $enabled.is(":checked"));
		$(this).data("ignoreExtendOption", $ignoreExtendOption.is(":checked"));
		$(this).data("title", $title.val());
		$(this).data("command", $command.val());
		index += 1;
	});
}

/**
 * コンソールヘッダ更新
 */
function updateConsoleHeader(){
	$("#charCount").text(charCount($(".console-space").text()));
}

/**
 * 拡張設定行の追加
 */
function addExtendOptionRow() {
	let id = $(".extend-option-row").length + 1
	let tr =
		`<tr data-id="${id}" data-enabled="true" class="extend-option-row">
			<th data-type="id">${id}</th>
			<td><input type="checkbox" data-type="enabled" checked></td>
			<td><input type="textbox" data-type="name"></td>
			<td><input type="textbox" data-type="description"></td>
			<td><input type="checkbox" data-type="enabledTitle" checked></td>
			<td><input type="checkbox" data-type="enabledCommand" checked></td>
			<td><input type="button" data-command="delete" value="X"></td>
		`
	$(tr).appendTo($(".extend-option-list"));
	initialize();
}

/**
 * コマンド行の追加
 */
function addCommandRow() {
	let id = $(".command-row").length + 1
	let tr =
		`<tr data-id="${id}" data-enabled="true" class="command-row">
			<th data-type="id">${id}</th>
			<td><input type="checkbox" data-type="enabled" checked></td>
			<td><input type="checkbox" data-type="ignoreExtendOption"></td>
			<td><input type="textbox" data-type="title"></td>
			<td><input type="textbox" data-type="command"></td>
			<td><input type="button" data-command="delete" value="X"></td>
		`
	$(tr).appendTo($(".command-list"));
	initialize();
}

/**
 * JSONファイルを保存
 */
function saveJson() {
	let jsonItem = tableToDict();
	let isNewProfile = true;
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

/**
 * コマンドテーブルを辞書化
 * @returns コマンド辞書
 */
function tableToDict() {
	let dict = {};
	dict["profileId"] = $("#profile-id").val();
	dict["profileName"] = $("#profile-name").val();
	dict["os"] = $("#os-name").val();
	dict["options"] = {};
	dict["options"]["afterNewlineCount"] = $("#after-newline-count").val();

	let extendOptions = [];
	$("#extend-option-table").find(".extend-option-row").each(function () {
		let rowData = $(this).data();
		let data = {
			"id": rowData.id,
			"enabled": rowData.enabled,
			"name": rowData.name,
			"description": rowData.description,
			"enabledTitle": rowData.enabledTitle,
			"enabledCommand": rowData.enabledCommand,
		}
		extendOptions.push(data);
	});
	dict["extendOptions"] = extendOptions;

	let commands = [];
	$("#command-table").find(".command-row").each(function () {
		let rowData = $(this).data();
		let data = {
			"id": rowData.id,
			"ignoreExtendOption": rowData.ignoreExtendOption,
			"enabled": rowData.enabled,
			"title": rowData.title,
			"command": rowData.command
		}
		commands.push(data);
	});
	dict["commands"] = commands;
	return dict;
}

/**
 * JSONファイル読込
 */
async function readJsonFile() {
	[fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { "text/json": [".json"] } }] });
	const rowJsonFile = await fileHandle.getFile();
	jsonData = JSON.parse(await rowJsonFile.text());
	$(".extend-option-row").remove();
	$(".command-row").remove();
	readJson();
}

/**
 * JSON読込+コマンドテーブル更新
 */
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

	// コマンド詰め込み
	for (let item of jsonData.items) {
		if (item.profileId == paramProfile) {
			selectProfile = item.profileId;
			// getパラメータを更新
			history.replaceState("", "", `?profile=${item.profileId}`);
			$("#profile-id").val(item.profileId);
			$("#profile-name").val(item.profileName);
			$("#os-name").val(item.os);
			$("#after-newline-count").val(item.options?.afterNewlineCount);
			let index = 1;
			// 拡張設定
			for (let extendOption of item.extendOptions) {
				let tr =
					`<tr class="extend-option-row" data-id="${extendOption.id}" data-enabled=${extendOption.enabled} data-name=${extendOption.name} data-description=${extendOption.description} data-enabledTitle=${extendOption.enabledTitle} data-enabledCommand=${extendOption.enabledCommand}>
				<th data-type="id">${extendOption.id}</th>
				<td><input type="checkbox" data-type="enabled" ${extendOption.enabled ? "checked" : ""}></td>
				<td><input type="textbox" data-type="name"></td>
				<td><input type="textbox" data-type="description"></td>
				<td><input type="checkbox" data-type="enabledTitle" ${extendOption.enabledTitle ? "checked" : ""}></td>
				<td><input type="checkbox" data-type="enabledCommand" ${extendOption.enabledCommand ? "checked" : ""}></td>
				<td><input type="button" data-command="delete" value="X"></td>
			`
				$(tr).appendTo($(".extend-option-list"));
				$(`.extend-option-row[data-id=${extendOption.id}]`).find("[data-type=name]").val(extendOption.name);
				$(`.extend-option-row[data-id=${extendOption.id}]`).find("[data-type=description]").val(extendOption.description);
				index += 1;
			}

			// コマンド
			for (const command of item.commands) {
				let tr =
					`<tr class="command-row" data-id="${command.id}" data-enabled=${command.enabled} data-title="${command.title}" data-command="${command.command}">
					<th data-type="id">${command.id}</th>
					<td><input type="checkbox" data-type="enabled" ${command.enabled ? "checked" : ""}></td>
					<td><input type="checkbox" data-type="ignoreExtendOption" ${command.ignoreExtendOption ? "checked" : ""}></td>
					<td><input type="textbox" data-type="title"></td>
					<td><input type="textbox" data-type="command"></td>
					<td><input type="button" data-command="delete" value="X"></td>
				`
				$(tr).appendTo($(".command-list"));
				$(`.command-row[data-id=${command.id}]`).find("[data-type=title]").val(command.title);
				$(`.command-row[data-id=${command.id}]`).find("[data-type=command]").val(command.command);
				index += 1;
			}
		}
	}
	initialize();
}

/**
 * プロファイル変更
 */
function changeProfile() {
	let newProfile = $("#profile-list option:selected").val()
	history.replaceState("", "", `?profile=${newProfile}`);
	// テーブルをクリア
	$(".extend-option-row").remove();
	$(".command-row").remove();
	readJson();
}

/**
 * JSONファイルダウンロード
 */
function downloadJsonFile() {
	const blob = new Blob([JSON.stringify(jsonData)]);

	const link = document.createElement('a');
	link.download = 'data.json';
	link.href = URL.createObjectURL(blob);
	link.click();
}

/**
 * JSONファイル更新
 */
async function updateJsonFile() {
	// [fileHandle] = await window.showOpenFilePicker({ types: [{ accept: { "text/json": [".json"] } }] });
	// const file = await fileHandle.getFile();
	const writable = await fileHandle.createWritable();
	await writable.write(JSON.stringify(jsonData));
	await writable.close();
	toast("保存しました！");
}

/**
 * 行削除
 * @param {*} object 行データ(HTML)
 */
function deleteRow(object) {
	object.parent().parent().remove();
}

/**
 * プロファイル削除
 * @returns 
 */
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

/**
 * string自身をHTMLタグで囲む
 * @param {*} htmlTag 
 * @returns HTMLタグ
 */
String.prototype.wrapHtmlTag = function (htmlTag) {
	return `<${htmlTag}>${this}</${htmlTag}>`;
}

/**
 * トースト
 * @param {*} msg 表示テキスト
 */
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

/**
 * 文字を1文字ずつ分割する関数
 * @param {string} text 
 * @returns 
 */
function splitText(text) {
	return Array.from(text).map(char => {
		const span = document.createElement('span');
		span.textContent = char;
		return span;
	});
}

/**
 * 数字だけを含む要素
 * @param {array} spans 
 */
function styleDigitSpans(spans) {
	spans.forEach(span => {
		if (/\d/.test(span.textContent)) {
			span.classList.add('console-digit');
		}
	});
}

/**
 * 記号だけを含む要素
 * @param {array} spans 
 */
function styleSymbolSpans(spans) {
	spans.forEach(span => {
		if (/^[^a-zA-Z0-9]+$/.test(span.textContent)) {
			span.classList.add('console-symbol');
		}
	});
}

/**
 * 大文字だけを含む要素
 * @param {array} spans 
 */
function styleUpperSpans(spans) {
	spans.forEach(span => {
		if (/^[A-Z]+$/.test(span.textContent)) {
			span.classList.add('console-upper');
		}
	});
}

/**
 * コードの行を更新する関数
 * @param {jqueryObject} spanTag 
 */
function updateCodeLine(spanTag) {
	// 既存の文字を分割した要素を削除する
	code = spanTag.text();
	spanTag.text("");

	// 新しい文字を分割した要素を作成し、行に追加する
	let textSpans = splitText(code);
	styleDigitSpans(textSpans);
	styleSymbolSpans(textSpans);
	styleUpperSpans(textSpans);
	textSpans.forEach(span => spanTag.append(span));
}

/**
 * 文字数カウント
 * @param {*} str 
 * @returns 文字数
 */
function charCount(str){
	return str.length;
}