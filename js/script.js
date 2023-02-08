$(window).on("load", function () {
	$(".sortable-list").sortable({
		axis: "y",
		containment: $("#table-wrapper"),
		create: function (event, ui) { update_console(this); },
		deactivate: function (event, ui) { update_console(this); }
	});

	$("#test-button").on("click", function () {
		console.log("");
		$(".sortable-list").find("[data-type='text']").each(function (i) {
			console.log((i + 1) + $(this).text());
		});
	});

	$("#is-output-file").on("click", function () { update_console($(".sortable-list")) });
});

function update_console(jObject) {
	$console = $(".console-space");
	$console.text("");
	$(jObject).children().each(function () {
		command = $(this).find("[data-type='command']").text();
		if ($("#is-output-file").is(":checked")) {
			command += " >> " + $("#output-file-name").val();

		}
		$console.html($console.html() + command + "<br>");
	})
}
