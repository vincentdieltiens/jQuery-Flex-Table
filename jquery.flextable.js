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
			
			var flexTable = new FlexTable($table, options);
			
			if( options.columnWidths != null ) {
				flexTable.init_column_widths();
				flexTable.update_column_widths();
			} 
			
			if( options.resizableClass != null ) {
				flexTable.set_header_resizeable();
			}
			
			if( options.ellipsisClass != null ) {
				flexTable.ellipsis_cell_content();
			}
			
			$(window).resize(function(){
				flexTable.update_column_widths();
			})
        });
	}
	
	
	/**
	 * Constructor class FlexTable
	 * 
	 * @param $table the table html object
	 * @param options the options
	 */
	function FlexTable($table, options) {
		this.options = options;
		this.$table = $table;
		
		this.column_widths = [];
		this.pixel_column_total_width = 0;
		this.number_of_pixel_columns = 0;
		
		this.init_colgroup();
	}
	
	FlexTable.prototype = {
		
		init_column_widths: function() {
			for(var col_index in this.options.columnWidths) {

				var column_width = ""+this.options.columnWidths[col_index];

				if( /^[0-9]+%$/.test(column_width) ) {
					// Width is a percentage
					var percentage = parseInt(column_width.substring(0, column_width.length -1));
					this.column_widths[col_index] = {'type':'percentage', 'val':percentage};

				}
				else if( /^[0-9]+px$/.test(column_width) ) {
					// Width is in pixels
					var pixels = parseInt(column_width.substring(0, column_width.length -2));
					this.column_widths[col_index] = {'type':'pixels', 'val': pixels};

					this.pixel_column_total_width += pixels;
					this.number_of_pixel_columns += 1;
				} 
				else if( /^[0-9]+$/.test(column_width) ) {
					// Width is in pixels
					var pixels = parseInt(column_width);
					this.column_widths[col_index] = {'type':'pixels', 'val': pixels};

					this.pixel_column_total_width += pixels;
					this.number_of_pixel_columns += 1;
				}
				else {
					alert('size at index '+col_index+' in option columnWidths not understood');
				}
			}
		},
		
		update_column_widths: function() {
			var table_width = this.$table.width();
			var relative_width = table_width - this.pixel_column_total_width;

			var col_index = 0;

			var self = this;
			
			var w = ''
			this.$table.find('thead').find('th').each(function(){

				var column_width = self.column_widths[col_index];
				var $col = $(this);
				
				if( column_width.type == 'percentage' ) {
					$col.css('width', relative_width * column_width.val/100 );
					w += (relative_width * column_width.val/100)+'px ';
				} else {
					$col.css('width', column_width.val );
					w += column_width.val+'px ';
				}
				
				col_index += 1;
			});
			
			
			this.$table.find('tbody').find('tr').each(function(){
				
				col_index = 0;
				$(this).find('td').each(function(){

					var column_width = self.column_widths[col_index];
					var $td = $(this);

					if( column_width.type == 'percentage' ) {
						$td.css('width', relative_width * column_width.val/100 );
						//w += (relative_width * column_width.val/100)+'px ';
					} else {
						$td.css('width', column_width.val );
						//w += column_width.val+'px ';
					}

					if( $td.hasClass(self.options.resizeableClass) ) {
						$(this).find('div').css('width', $td.width()+'px');
					}

					col_index += 1;
				});
			});
			$('h1').html(w);
			
			
			/*if( this.options.resizeableClass != null ) {
				this.$table.find('tbody').find('td.'+this.options.resizeableClass+' div').each(function(){
					var cell_width = $(this).parent('td').width();
					this.csss('width', cell_width+'px');
				});
			}*/
			
			
		},
		
		/**
		 * Initialize the colgroup if it's not defined in the HTML
		 * @param $table the table html object
		 * @param options the options
		 */
		init_colgroup: function() {
			if( this.$table.find('colgroup').size > 0 ) {
				return;
			}

			$colgroup = $('<colgroup />');

			var col_count = 0;
			this.$table.find('thead').find('th').each(function() {
				$col = $('<col />');
				$colgroup.append($col);
				col_count++;
			});

			//$colgroup.find('col').width( this.$table.width()/col_count );

			this.$table.prepend($colgroup);
		},
		
		ellipsis_cell_content: function() {
			// For each td with the elipisis class, we wrap its content with
			// a <div> which truncate the content if needed
			this.$table.find('tbody').find('td.'+this.options.ellipsisClass).each(function() {

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
		},
		
		/**
		 * Set header as resizeable. In other words, each columns
		 * with the class stored in "options.resizeableClass" can be resized
		 */
		set_header_resizeable: function() {
			// We add a <span> for each header to permit it to be resizable
			this.$table.find('thead').find('th.'+this.options.resizeableClass).each(function() {
				$(this).prepend('<span class="ui-resize"></span>');
			});	
		}
	};
	
	// Default options for this plugin
	$.fn.flextable.defaults = {
		ellipsisClass: 'truncate',
		resizeableClass: 'resizeable',
		columnWidths: null
	};
	
	$.fn.flextable.lazyDefaults = {
		ellipsisClass: null,
		resizeableClass: null,
		columnWidths: null
	}
})(jQuery);