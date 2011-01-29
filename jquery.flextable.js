(function($){
    $.fn.flextable = function(options) {
        var options = $.extend({}, $.fn.table.defaults, options);
       
        obj = this;
        return obj.each(function(){
            var table = $(this);
            if( table.is('table') ) {
                
               	table.css('width', '100%');
                
				table.find('thead').find('th').each(function(){
					$(this).prepend('<span class="ui-resize"></span>');
				});
				
				table.find('tbody').find('td.'+options.ellipsisClass).each(function(){
					
					var cell_width = $(this).width();
					var cell_content = $(this).html();
					
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
						})
					$(this).html(wrapper_div);
					$(this).attr('title', cell_content);
				});
				
				

            }
            
        });
   }
   
   $.fn.table.defaults = {
		ellipsisClass: 'truncate'
   };
})(jQuery);