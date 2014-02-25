/**
 * jQuery button - v1.0
 * auth: shenmq
 * E-mail: shenmq@yuchengtech.com
 * website: shenmq.github.com
 *
 */

(function( $, undefined ){

	"use strict"

 	/* BUTTON PUBLIC CLASS DEFINITION
	 * ============================== */

	var Editor = function ( element, options ) {
		this.$element = $(element);
		this.options = $.extend({}, $.fn.button.defaults, options);
		this.init()
	}

	Editor.prototype = {
	
		constructor: Editor,

		init: function() {
		    var self = this
		    this.$element.on("click", ".js-color-cooser-color",
            function() {
                var color, target;
                return color = "#" + $(this).data("hex-color"),
                target = self.$element.find(".js-color-editor-input"),
                self.$element.find(".js-label-editor-submit").removeClass("disabled"),
                self.$element.removeClass("is-valid is-not-valid"),
                target.val(color),
                self.colorCooser(target, color)
            })
		},

		colorCooser: function(target, color) {
            return target.closest(".js-label-editor").find(".js-color-editor-bg").css("background-color", color),
            target.css("color", this.genColor(color, -.5)),
            target.css("border-color", color)
        },

        genColor: function(source, rate) {
            var rgb, count, color;
            for (source = String(source).toLowerCase().replace(/[^0-9a-f]/g, ""), source.length < 6 && (source = source[0] + source[0] + source[1] + source[1] + source[2] + source[2]), rate = rate || 0, color = "#", rgb = void 0, count = 0; 3 > count;)
                rgb = parseInt(source.substr(2 * count, 2), 16),
                rgb = Math.round(Math.min(Math.max(0, rgb + rgb * rate), 255)).toString(16),
                color += ("00" + rgb).substr(rgb.length),
                count++;
            return color
        },
		
		setState: function ( state ) {
			
			var d = 'disabled', 
				$el = this.$element,
				data = $el.data(),
				val = $el.is('input') ? 'val' : 'html';
			
			state = state + 'Text';
			data.resetText || $el.data('resetText', $el[val]());
			
			$el[val](data[state] || this.options[state]);
			
			// push to event loop to allow forms to submit
			setTimeout(function () {
			  	state == 'loadingText' ?
			    	$el.addClass(d).attr(d, d) :
			    	$el.removeClass(d).removeAttr(d)
			}, 0);
		}, 
		
		toggle: function () {;
			this.$element.addClass("open")
		}
	
	}


 	/* BUTTON PLUGIN DEFINITION
	 * ======================== */

	$.fn.editor = function ( option ) {
		return this.each(function () {
			var $this = $(this), 
				data = $this.data('editor'),
				options = typeof option == 'object' && option;
			if (!data) 
				$this.data('editor', (data = new Editor(this, options)));
			if (option == 'toggle') 
				data.toggle();
			else if (option) 
				data.setState(option);
		});
	}

  	$.fn.editor.defaults = {
		loadingText: 'loading...'
  	}

  	$.fn.editor.Constructor = Editor


 	/* BUTTON DATA-API
 	 * =============== */

	$(function () {
		$('body').on('focusin.editor.data-api', '[data-toggle^=editor]', function ( e ) {
			var $btn = $(e.target);
			
		  	if (!$btn.hasClass('js-label-editor'))
		  		$btn = $btn.closest('.js-label-editor');

		  	$btn.editor('toggle');
		  	e.stopPropagation();
		  	e.preventDefault()
		});

		$(document).on("submit", ".js-label-editor form", function() {
            var t, e;
            return t = $(this).find(".js-color-editor-input"),
            e = t.val(),
            e.length < 6 && (e = e[1] + e[1] + e[2] + e[2] + e[3] + e[3]),
            t.val(e.replace("#", ""))
        })

	})

})(jQuery );