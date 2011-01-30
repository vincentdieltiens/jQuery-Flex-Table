/**
 * jQuery textwidth plugin
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
	
	$.textwidth = function(text, style) {
		
		if( typeof style != 'object' ) {
			throw new Error('style parameter must be an object. '+(typeof style)+' found');
		}
		
		if( !('font-size' in style) || !('font-family' in style) ) {
			throw new Error('style parameter is not well defined');
		}
		
		var $div = $('<div />').html(text).css({
			'visibility': 'hidden',
			'position': 'absolute',
			'font-size': style['font-size'],
			'font-family': style['font-family']
		});
		$('body').append($div);
		var text_width = $div.width();
		//$div.remove();
		return text_width;
	};
	
})(jQuery);