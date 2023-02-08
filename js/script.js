$(window).on("load", function () {
	read_json();
	$(".sortable-list").sortable({
		axis: "y",
		containment: $("#table-wrapper"),
		create: function (event, ui) { update_console(); },
		deactivate: function (event, ui) { update_console(); }
	});
});

function initialize() {
	$("input").off("click");
	$("input").on("click", function () { update_console(); });

	$("#test-button").off("click");
	$("#test-button").on("click", function () {
		console.log("");
		$(".sortable-list").find("[data-type='title']").each(function (i) {
			console.log((i + 1) + $(this).text());
		});
	});

	$("#output-file-name").off("keypress");
	$("#output-file-name").on("keypress", function (e) {
		if (e.keyCode == 13) update_console();
	})
}

function update_console() {
	$console = $(".console-space");
	$console.text("");
	$(".sortable-list").children().each(function () {
		// each内でreturn trueをするとContinue
		if (!$(this).find("[data-type='enabled']").is(":checked")) {
			return true;
		}
		command = $(this).find("[data-type='command']").text();
		if ($("#is-output-file").is(":checked")) {
			command += " >> " + $("#output-file-name").val();

		}
		$console.html($console.html() + command + "<br>");
	})
}

function read_json() {
	let jsonData
	fetch('./data.json')
		.then(response => {
			return response.json();
		})
		.then(function (json) {
			for (const data of json.data) {
				if (data.os == "RHEL8.6") {
					var index = 1;
					for (const command of data.commands) {
						var checked = command.enabled ? "checked" : "";
						var tr =
							`<tr data-no="${index}">
						<th data-type="id">${command.id}</th>
						<td><input type="checkbox" data-type="enabled" ${checked}></td>
						<td data-type="title">${command.title}</td>
						<td data-type="command">${command.command}</td>
					`
						$(tr).appendTo($(".sortable-list"));
						index += 1;
					}
				}
			}
			// 初回アップデート用
			update_console($(".sortable-list"));
			initialize();
		});
	return jsonData;
}