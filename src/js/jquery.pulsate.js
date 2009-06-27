jQuery.fn.pulsateOpacity = function(callback) {
	return this.each(function() {
		var mm = $(this);
		mm.fadeTo(1000, 0.2, function() {
			mm.fadeTo(1000, 1, function() {
				if(callback != undefined)
					callback();
			});
		});
	});
}
