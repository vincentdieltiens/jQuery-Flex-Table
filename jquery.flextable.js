(function($){
	$.fn.flextable = function(options) {
		// Extends and merges default options with options given by the user
        var options = $.extend({}, $.fn.flextable.defaults, options);
       
        obj = this;

		// Apply on each object
        return obj.each(function(){
            
			// This plugin must be applied only on tables. 
			//Stop if current object is not a table.
            if( !$(this).is('table') ) {
				return;
			}
			
			var $table = $(this);
			
			// We add a <span> for each header to permit it to be resizable
			$table.find('thead').find('th').each(function() {
				$(this).prepend('<span class="ui-resize"></span>');
			});
			
			// For each td with the elipisis class, we wrap its content with
			// a <div> which truncate the content if needed
			$table.find('tbody').find('td.'+options.ellipsisClass).each(function() {
				// Get the cell of the <td> cell
				var cell_width = $(this).width();
				
				// Get the content of the <td> cell before wrapping
				var cell_content = $(this).html();
				
				// Create the wrapper <div>
				// Important : we need to set explicitly the width of the wrapper div
				// 	to make the text-overflow: ellipsis working !	
				var wrapper_div = $('<div />').html(cell_content).width(cell_width)
					.css({
						'white-space': 'nowrap',
						'overflow': 'hidden',
						'text-overflow': 'ellipsis',
						'-o-text-overflow': 'ellipsis',
						'-icab-text-overflow': 'ellipsis',
						'-khtml-text-overflow': 'ellipsis',
						'-moz-text-overflow': 'ellipsis',
						'-webkit-text-overflow': 'ellipsis'
					});
				
				// update the content of the <td> cell
				$(this).html(wrapper_div);
				
				// put a title for the <td> cell
				$(this).attr('title', cell_content);
			});
			
        });
	}
   
	// Default options for this plugin
	$.fn.flextable.defaults = {
		ellipsisClass: 'truncate'
	};
})(jQuery);