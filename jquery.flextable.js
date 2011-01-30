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
			
			if( options.ellipsisClass != null ) {
				flexTable.ellipsis_cell_content();
			}
			
			/*$(window).resize(function(){
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
				
				//alert('bind resize');
				$td.bind('resize', function(e, new_width){
					$(this).find('div').width(new);
					$(this).width(new_width);
				});
			});
		},
		
		/**
		 * Set header as resizeable. In other words, each columns
		 * with the class stored in "options.resizeableClass" can be resized
		 */
		set_header_resizeable: function() {
			var self = this;
			
			this.$table.wrap('<div />');
			
			var $sashes = $('<div />').addClass('sashes');
			
			// For each header cell, if it's resizeable add a <span> for the drag
			var th_index = 0;
			this.$table.find('thead').find('th').each(function() {
				var $th = $(this);
				var th_index_copy = th_index;
				
				if( !$th.hasClass(self.options.resizeableClass) ) {
					th_index += 1;
					return;
				}
				
				var sash_pos = $th.position().left + 
					$th.width();
				
				var $sash = $('<div />').addClass('ghost').css({
					'position': 'absolute',
					'height': self.$table.height(),
					'left': (sash_pos+2)+'px',
					'cursor': 'col-resize',
				})
				
				$sashes.append($sash);
				
				// and add some action on span
				$sash.mousedown(function(e){
					self.ghost_drag_start($th, $(this), th_index_copy, e);
				});

				self.$table.mousemove(function(e){
					if( self.dragging == true ) {
						self.ghost_drag_move($sash, th_index_copy, e);
					}
				});

				$sash.mouseup(function(e){
					if( self.dragging ) {
						var $th_copy = $th;
						self.ghost_drag_stop($th_copy, $sash, th_index_copy, e);
					}

				});
				
				th_index += 1;
			});
			
			self.$table.before($sashes);
		},
		
		/**
		 * Starts the drag of the ghost
		 * @param $th the cell that is resized
		 * @param $span the span that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_start: function($th, $sash, th_index, e) {
			// Indicates that a drag is started
			this.dragging = true;
			// Store the position of the start drag (to calcule the distance of the drag)
			this.drag_x = e.clientX;
			
			this.$table.css({
				'MozUserSelect' : 'none'
			}).bind('selectstart.disableTextSelect', function() {
				return false;
			}).bind('mousedown.disableTextSelect', function() {
				return false;
			});
			
			$sash.addClass('ghost_move');
			
			// Moves and show the ghost
			$sash.css({
				left: e.clientX+'px',
			}).show();
		},
		
		/**
		 * Moves the ghost according to the position of the cursor
		 * @param $span the span that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_move: function($sash, th_index, e) {
			// Moves the cursor...
			$sash.css({
				left: e.clientX+'px',
			});
		},
		
		/**
		 * Stop the move of the ghost and hide it.
		 * Also, update the column sizes
		 * @param $sash the sash that is dragged 
		 * @param th_index the index of the column that is resized
		 * @param e the event object
		 */
		ghost_drag_stop: function($th, $sash, th_index, e) {
			var self = this;
			
			$sash.removeClass('ghost_move');
			
			self.$table.css({
				'MozUserSelect' : ''
			}).unbind('selectstart.disableTextSelect')
			.unbind('mousedown.disableTextSelect');
			
			// Hide Stop the drag of the ghost
			this.dragging = false;
			
			// Width of the th
			var th_width = $th.width();
			
			//
			
			// Gets the distance of the drag
			var drag_distance = e.clientX - this.drag_x;
			
			// Do nothing if there is no drag
			if( drag_distance == 0 ) {
				return;
			}
			
			var diff = 0;
			if( self.options.changeTableWidthOnColResize == true ) {
				// set the new size of the table
				self.$table.width( self.$table.width() + e.clientX - this.drag_x );
				
				// set the new Width
				$th.width(th_width + drag_distance);
				
				// Gets the difference between the width wanted by the user and the real one
				diff = $th.width() - th_width;
				
				$next_th = $th.next();
				
				var new_sash_pos = $next_th.position().left - 2;
				$sash.css({'left': new_sash_pos+'px'});
				
				
			} else {
				
				// Tries to set the new width
				$th.width(th_width + drag_distance);
				
				// Gets the difference between the width wanted by the user and the real one
				diff = $th.width() - th_width;

				// Get the next column and resize it !
				$next_th = $th.next();
				$next_th.width( $next_th.width() - diff );
				
				var new_sash_pos = $next_th.position().left - 2;
				$sash.css({'left': new_sash_pos+'px'});
			}
			
			if( drag_distance != 0 ) {
				self.$table.find('tbody').find('tr').each(function(){
					var $tr = $(this);
					var index = 0;
					$tr.find('td').each(function() {
						//$td.width(50);
						
						if( index == th_index ) {
							var $td = $(this);
							
							/*if( $td.hasClass(self.options.ellipsisClass) ) {
								$td.find('div').width( 50 );
								$td.width(50);
							}*/
							var new_width = $td.width() + drag_distance;
							$td.trigger('resize', [new_width]);
						}
						index += 1;
					});
				});
			}
			
			/*if( self.options.ellipsisClass != null ) {
				if( $td.hasClass(self.options.ellipsisClass) ) {
					alert('lol');
					$td.find('div').width($td.width());
				}
			}*/
			
			
			
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
		ghostClass: null,
		changeTableWidthOnColResize: false
	};
	
	$.fn.flextable.lazyDefaults = {
		ellipsisClass: null,
		resizeableClass: null,
		columnWidths: null,
		ghostClass: null,
		changeTableWidthOnColResize: false
	}
})(jQuery);