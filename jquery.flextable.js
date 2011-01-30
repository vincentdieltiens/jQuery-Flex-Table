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
       	
        var obj = this;
		
		// Apply on each object
        return obj.each(function(){
            
			// This plugin must be applied only on tables. 
			//Stop if current object is not a table.
            if( !$(this).is('table') ) {
				return;
			}
			
			var $table = $(this);
			
			// Create a FlexTable object
			var flexTable = new FlexTable($table, options);
			
			/*if( options.columnWidths != null ) {
				flexTable.init_column_widths();
				flexTable.update_column_widths();
			}*/
			
			if( options.resizeableClass != null ) {
				flexTable.set_header_resizeable();
			}
			
			/*if( options.ellipsisClass != null ) {
				flexTable.ellipsis_cell_content();
			}
			
			$(window).resize(function(){
				flexTable.update_column_widths();
			})*/
        });
	}
	
	
	/**
	 * Constructor class FlexTable
	 * 
	 * @param $table the table html object
	 * @param options the options
	 */
	function FlexTable($table, options) {
		// Plugin option
		this.options = options;
		
		// HTML table object
		this.$table = $table;
		
		// The ghost vertial line for resizing
		this.$ghost = null;
		
		// information about dragging resizing col
		this.dragging = false;
		this.drag_x = 0;
		
		// informations
		this.column_widths = [];
		this.width_for_all_fixed_columns = 0;
		this.fixed_columns_count = 0;

		//this.init_colgroup();
	}
	
	FlexTable.prototype = {
		
		/**
		 * Get informations about the widths of the columns
		 * All informations are put in the column_widths instance of the class, e.g. :
		 * column_widths = [
		 *   {'type':'flexible', 'width':50}, // for 50% of the flexible space
		 * 	 {'type':'fixed', 'width': 70} // for 70 pixels 
		 * ];
		 * 
		 * pre-condition : this.options.columnWidths cant be null
		 */
		init_column_widths: function() {
			// browse the widths given by the user
			for(var col_index in this.options.columnWidths) {
				
				// current column width
				var column_width = ""+this.options.columnWidths[col_index];

				// Test the type of the width
				if( /^[0-9]+%$/.test(column_width) ) {
					// Width is a flexible value
					var percentage = parseInt(column_width.substring(0, column_width.length -1));
					this.column_widths[col_index] = {
						type: 'flexible', 
						width: percentage
					};
				}
				else if( /^[0-9]+px$/.test(column_width) ) {
					// Width is fixed in pixels
					var pixels = parseInt(column_width.substring(0, column_width.length -2));
					this.column_widths[col_index] = {
						type: 'fixed', 
						width: pixels
					};

					this.width_for_all_fixed_columns += pixels;
					this.fixed_columns_count += 1;
				} 
				else if( /^[0-9]+$/.test(column_width) ) {
					// Width is fixed in pixels
					var pixels = parseInt(column_width);
					this.column_widths[col_index] = {
						type: 'fixed', 
						width: pixels
					};

					this.width_for_all_fixed_columns += pixels;
					this.fixed_columns_count += 1;
				}
				else {
					alert('size at index '+col_index+' in option columnWidths not understood');
				}
			}
		},
		
		/**
		 * Update the column width contingent on the table width
		 */
		update_column_widths: function() {
			// store the current table width
			var table_width = this.$table.width();
			
			// get the relative space. It's the width of the table without
			// the width of each fixed column.
			var relative_width = table_width - this.width_for_all_fixed_columns;

			// initialization...
			var col_index = 0;
			var self = this;
			
			// For each column header, we will update the width
			this.$table.find('thead').find('th').each(function(){
				var $th = $(this);
				
				// get the width of the column (defined by the user)
				var column_width = self.column_widths[col_index];

				// according to the type, set the width...
				if( column_width.type == 'flexible' ) {
					$th.width(relative_width * column_width.width/100);
				} else {
					$th.width(column_width.width);
				}
				
				col_index += 1;
			});
			
			// For each table cell of each line of the table body
			// we must update the width of the sub div (for ellipsis)
			this.$table.find('tbody').find('tr').each(function(){
				
				/*col_index = 0;
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
					
					if( self.options.ellipsisClass != null ) {
						if( $td.hasClass(self.options.ellipsisClass) ) {
							$td.find('div').css('width', $td.width()+'px');
						}
					}
					
					col_index += 1;
				});*/
				
			});
			
		},
		
		/**
		 * Initialize the colgroup if it's not defined in the HTML
		 */
		init_colgroup: function() {
			// Checks if a <colgroup> tag is already defined. If it is, stop.
			if( this.$table.find('colgroup').size > 0 ) {
				return;
			}

			// Create the <colgroup> tag
			$colgroup = $('<colgroup />');

			// For each column, create a <col> tag
			var col_count = 0;
			this.$table.find('thead').find('th').each(function() {
				$col = $('<col />');
				$colgroup.append($col);
				col_count++;
			});

			//$colgroup.find('col').width( this.$table.width()/col_count );
			// Attach the colgroup to the table
			this.$table.prepend($colgroup);
		},
		
		/**
		 * For each cell set as ellipsis (with the options.ellipsisClass),
		 * creates a sub <div> that will wrap the content of this cell.
		 * This <div> permit the CSS text-overflow (and his browser specific friends)
		 *
		 * This sub <div> is necessary because text-overflow doesn't work with <td> !
		 */
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
			var self = this;
			
			// Create a ghost vertical line to display when resizing the column
			this.$ghost = $('<div />');
			
			if( this.options.ghostClass != null ) {
				//alert(this.options.ghostClass);
				this.$ghost
					.addClass(this.options.ghostClass)
					.css({
						'position': 'absolute',
						'height': this.$table.height()+'px',
						'cursor': 'col-resize',
					});
			} else {
				this.$ghost.css({
					'width': '5px',
					'position': 'absolute',
					'background-color': '#880000',
					'cursor': 'col-resize',
					'height': this.$table.height()+'px',
				});
			}
			//this.$ghost.hide();
			
			self.$table.before(this.$ghost);
			
			// For each header cell, if it's resizeable add a <span> for the drag
			var th_index = 0;
			this.$table.find('thead').find('th').each(function() {
				$th = $(this).css({
					'MozUserSelect' : 'none'
				}).bind('selectstart.disableTextSelect', function() {
					return false;
				}).bind('mousedown.disableTextSelect', function() {
					return false;
				});
				
				if( !$th.hasClass(self.options.resizeableClass) ) {
					th_index += 1;
					return;
				}
				
				// create new span
				$span = $('<span/>').addClass('ui-resize');
				
				// append to the header cell
				$th.append($span);
				
				// and add some action on span
				$span.mousedown(function(e){
					var th_index_copy = th_index;
					self.ghost_drag_start($(this), th_index_copy, e);
				});

				self.$table.mousemove(function(e){
					if( self.dragging == true ) {
						var th_index_copy = th_index;
						self.ghost_drag_move($span, th_index_copy, e);
					}
				});

				self.$ghost.mouseup(function(e){
					if( self.dragging ) {
						var th_index_copy = th_index;
						self.ghost_drag_stop($span, th_index_copy, e);
					}

				});
				
				th_index += 1;
			});
		},
		
		/**
		 * Starts the drag of the ghost
		 * @param $span the span that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_start: function($span, th_index, e) {
			// Indicates that a drag is started
			this.dragging = true;
			// Store the position of the start drag (to calcule the distance of the drag)
			this.drag_x = e.clientX;
			
			// Moves and show the ghost
			this.$ghost.css({
				left: e.clientX+'px',
			}).show();
		},
		
		/**
		 * Moves the ghost according to the position of the cursor
		 * @param $span the span that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_move: function($span, th_index, e) {
			// Moves the cursor...
			this.$ghost.css({
				left: e.clientX+'px',
			});
		},
		
		/**
		 * Stop the move of the ghost and hide it.
		 * Also, update the column sizes
		 * @param $span the span that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_stop: function($span, th_index, e) {
			var self = this;
			
			// Hide Stop the drag of the ghost
			this.$ghost.hide();
			this.dragging = false;
			
			// Gets the header cell that we will resize
			var $th = $span.parent('th');
			
			// Width of the th
			var th_width = $th.width();
			
			//this.$table.width( this.$table.width() + e.clientX - this.drag_x );
			
			// Gets the distance of the drag
			var drag_distance = e.clientX - this.drag_x;
			
			// Tries to set the new width
			$th.width(th_width + drag_distance);
			
			// Gets the difference between the width wanted by the user and the real one
			var diff = $th.width() - th_width;
			
			// Get the next column and resize it !
			$next_th = $th.next();
			$next_th.width( $next_th.width() - diff );
			
			// If there is a difference
			/*if( diff != 0 ) {
				this.$table.find('thead').find('tr').each(function(){

					$tr = $(this);

					var index = 0;
					var flex_col_number = 0;
					$tr.find('th').each(function() {

						var column_width = self.column_widths[index];

						if( column_width.type == 'flexible' ) {
							$(this).width(column_width.val/100 * diff);
						}
						
						flex_col_number += 1;
						
						index += 1;
					});
				});
			}*/
		} 
	};
	
	// Default options for this plugin
	$.fn.flextable.defaults = {
		ellipsisClass: 'truncate',
		resizeableClass: 'resizeable',
		columnWidths: null,
		ghostClass: null
	};
	
	$.fn.flextable.lazyDefaults = {
		ellipsisClass: null,
		resizeableClass: null,
		columnWidths: null,
		ghostClass: null
	}
})(jQuery);