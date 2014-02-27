/**
 * jQuery button - v1.0
 * auth: shenmq
 * E-mail: shenmq@yuchengtech.com
 * website: shenmq.github.com
 *
 */

(function( $, undefined ){
    $.lily = $.lily || {}


    $.extend( $.lily, {
    	minInterval: 1000,
        browser: function(browser) {
    		var ua = navigator.userAgent.toLowerCase();
    		var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];

    		if (browser == 'version')
    		{
    			return match[2];
    		}

    		if (browser == 'webkit')
    		{
    			return (match[1] == 'chrome' || match[1] == 'webkit');
    		}
    		return match[1] == browser;
    	},
        oldIE: function() {
    			if ($.lily.browser('msie') && parseInt($.lily.browser('version'), 10) < 9) {
    				return true;
    			}
    			return false;
    	},
    	ajax: function(options) {
    		//console.log(options);
    		//try{initAutoOutTimer();}catch(e){};
    		var startTime = (new Date()).getTime()
    		var option = $.extend(options, {cache:false, dataType:'json',traditional: true});


    		function doResponse(data) {
    		    options.processResponse(data.content)
    		}
    	    if(options.processResponse) {
        		$.extend(options, {success: doResponse})
            }

    		return $.ajax(option);
    	}
    });

	$(function () {
		$('body').on('click.component.data-api', function ( e ) {
		    if($.lily.lastComponent)
		        $.lily.lastComponent.close()
		});

		$('body').on('click.remote.data-api', '[data-toggle^=remote]', function ( e ) {

            var $btn = $(e.target);

            if (!$btn.hasClass('btn'))
                $btn = $btn.closest('.btn');

            function processResponse(reponseData) {
                if($btn.attr('data-method') === 'delete') {
                    $btn.remove()
                }
            }

            $.lily.ajax({url: $btn.attr('href'),
                type: $btn.attr('data-method'),
                dataType: 'json',
                processResponse: processResponse
            })

            e.stopPropagation();
            e.preventDefault()
        });
        $(document).on("click", ".js-new-issue-form .js-composer-labels", function(e) {
            var $btn = $(e.target);

            if (!$btn.hasClass('filter-item'))
                $btn = $btn.closest('.filter-item');
            $btn.toggleClass('selected')
            var checkBox = $btn.find('input')
            checkBox.attr("checked") ? checkBox.attr("checked", false) : checkBox.attr("checked", true)
            e.stopPropagation();
            e.preventDefault()
        })
        $(document).on("click", ".dropdown-toggle .js-menu-target", function() {
            return $(".dropdown-toggle .js-menu-content").html($(".js-new-dropdown-contents").html())
        })
	})

})(jQuery );