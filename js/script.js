$(window).on("load", function(){
	$(".sortable-list").sortable();
	
	$("#test-button").on("click", function(){
		console.log("");
		$(".sortable-list").find("[data-type='text']").each(function(i){
			console.log((i+1) + $(this).text());
		});
	});
});
