$(window).on("load", function () {
	read_json();
	$(".sortable-list").sortable({
		axis: "y",
		containment: $("#table-wrapper"),
		create: function (event, ui) { update_console(this); },
		deactivate: function (event, ui) { update_console(this); }
	});

	$("#test-button").on("click", function () {
		console.log("");
		$(".sortable-list").find("[data-type='title']").each(function (i) {
			console.log((i + 1) + $(this).text());
		});
	});

	$("#is-output-file").on("click", function () { update_console($(".sortable-list")) });
});

function update_console($object) {
	$console = $(".console-space");
	$console.text("");
	$($object).children().each(function () {
		command = $(this).find("[data-type='command']").text();
		if ($("#is-output-file").is(":checked")) {
			command += " >> " + $("#output-file-name").val();

		}
		$console.html($console.html() + command + "<br>");
	})
}

function read_json(){
	let jsonData
	fetch('./data.json')
	.then(response => {
		return response.json();
	})
	.then(function(json){
		console.log(json);
		for (const data of json.data){
			if(data.os == "RHEL8.6"){
				var index = 1;
				for (const command of data.commands){
					console.log(command.id)
					var tr = 
					`<tr data-no="${index}">
						<th data-type="id">${command.id}</th>
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
	});
	return jsonData;
}