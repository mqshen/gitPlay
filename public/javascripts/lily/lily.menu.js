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

	var Menu = function ( element, options ) {
		this.$element = $(element);
		this.options = $.extend({}, $.fn.button.defaults, options);
		this.$editor = this.$element.find(".js-label-editor");
		this.$editor.editor()
	}

	Menu.prototype = {

		constructor: Menu,

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

		close: function() {
		    this.$element.removeClass('active')
            this.$editor.removeClass("is-valid")
            this.$editor.removeClass("open")
		},

		toggle: function () {
			this.$element.addClass("open")
			if(this.$element.hasClass('active')) {
			    this.close()
            }
            else {
                $.lily.lastComponent = this
                this.$element.addClass('active')
                this.$editor.addClass("is-valid")
                this.$editor.addClass("open")
            }
		}

	}


 	/* BUTTON PLUGIN DEFINITION
	 * ======================== */

	$.fn.menu = function ( option ) {
		return this.each(function () {
			var $this = $(this),
				data = $this.data('menu'),
				options = typeof option == 'object' && option;
			if (!data)
				$this.data('menu', (data = new Menu(this, options)));
			if (option == 'toggle')
               data.toggle();
		});
	}

  	$.fn.menu.defaults = {
		loadingText: 'loading...'
  	}

  	$.fn.menu.Constructor = Menu


 	/* BUTTON DATA-API
 	 * =============== */

	$(function () {
		$(document).on("click", ".js-editable-label", function(e) {
            var $btn = $(e.target);
            if (!$btn.hasClass('js-editable-label'))
                $btn = $btn.closest('.js-editable-label');
            $btn.menu('toggle')
        })
	})

})(jQuery );