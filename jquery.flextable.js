/**
 * jQuery flextable plugin
 * @name jquery-flextable.js
 * @author Vincent Dieltiens - www.vincentdieltiens.be
 * @version DEV-0.1
 * @date January 29 2011
 * @category jQuery plugin
 * @copyright (c) 2011 Vincent Dieltiens (www.vincentdieltiens.com)
 * @license CC Attribution-No Derivative Works 2.5 Brazil - http://creativecommons.org/licenses/by-nd/2.5/br/deed.en_US
 * @example Visit http://www.vincentdieltiens.be/projects/jquery/flextable/ for more informations about this jQuery plugin
 */
(function($){
	/**
	 * Create a flex table for each element
	 *
	 * Note : for readability, all HTML objet variable begin with '$'
	 * @param opts : the options defined by the user
	 * @param lazy : only load needed
	 */
	$.fn.flextable = function(opts, lazy) {
		// Extends and merges default options with options given by the user
		var options;
		if( lazy == undefined ) {
			options = $.extend({}, $.fn.flextable.defaults, opts);
		} else {
			options = $.extend({}, $.fn.flextable.lazyDefaults, opts);
		}
       	
        obj = this;

		// Apply on each object
        return obj.each(function(){
            
			// This plugin must be applied only on tables. 
			//Stop if current object is not a table.
            if( !$(this).is('table') ) {
				return;
			}
			
			var $table = $(this);
			
			init_colgroup($table, options);
			
			if( options.resizableClass != null ) {
				set_header_resizeable($table, options);
			}
			
			if( options.ellipsisClass != null ) {
				ellipsis_cell_content($table, options);
			}
        });
	}
	
	/**
	 * Initialize the colgroup if it's not defined in the HTML
	 */
	function init_colgroup($table, options) {
		if( $table.find('colgroup').size > 0 ) {
			alert('found !');
			return;
		}

		$colgroup = $('<colgroup />');
		
		var col_count = 0;
		$table.find('thead').find('th').each(function() {
			$col = $('<col />');
			$colgroup.append($col);
			col_count++;
		});
		
		$colgroup.find('col').width( $table.width()/col_count );

		$table.prepend($colgroup);
	}
	
	function ellipsis_cell_content($table, options) {
		// For each td with the elipisis class, we wrap its content with
		// a <div> which truncate the content if needed
		$table.find('tbody').find('td.'+options.ellipsisClass).each(function() {
			
			var $td = $(this);
			
			// Get the cell of the <td> cell
			var cell_width = $td.width();
			
			// Get the content of the <td> cell before wrapping
			var cell_content = $td.html();
			
			// Create the wrapper <div>
			// Important : we need to set explicitly the width of the wrapper div
			// 	to make the text-overflow: ellipsis working !	
			var $wrapper_div = $('<div />').html(cell_content).width(cell_width)
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
			$td.html($wrapper_div);
			
			// put a title for the <td> cell
			$td.attr('title', cell_content);
		});
	}
   
	function set_header_resizeable($table, options) {
		// We add a <span> for each header to permit it to be resizable
		$table.find('thead').find('th.'+options.resizeableClass).each(function() {
			$(this).prepend('<span class="ui-resize"></span>');
		});
	}
	
	// Default options for this plugin
	$.fn.flextable.defaults = {
		ellipsisClass: 'truncate',
		resizeableClass: 'resizeable'
	};
	
	$.fn.flextable.lazyDefaults = {
		ellipsisClass: null,
		resizeableClass: null,
	}
})(jQuery);