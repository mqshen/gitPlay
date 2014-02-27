(function( $, undefined ){
    $(function() {
        var postData = function(t, e, n) {
            var s;
            if (s = t[0]) return $.ajax({
                context: s,
                type: e.type || t.attr("method"),
                url: t.attr("action"),
                data: e.data || t.serialize(),
                success: n
            })
        };
        $(document).on("click", ".js-issue-show-label-select-menu .js-navigation-item", function() {
            var e, n, s;
            return e = $(this).closest("form"),
            n = $(this).find("input[type=checkbox]"),
            s = {
                type: n.is(":checked") ? "put": "delete",
                data: {
                    "issueId": e.find(".js-issue-number").val(),
                    "labelName": n.val()
                }
            },
            postData(e, s, function() {
                return function(t) {
                    return $(".discussion-labels > .color-label-list, .js-timeline-label-list").html(t.labels)
                }
            } (this)),
            !1
        });
        $(document).on("click", ".js-assignee-picker .js-navigation-item", function() {
            var e;
            return e = $(this).closest("form"),
            postData(e, {},
            function(t) {
                return function() {
                    var e, n, s;
                    return e = $(t).closest(".js-assignee-picker"),
                    s = $(t).hasClass("js-clear-assignee"),
                    e.toggleClass("is-showing-clear-item", !s),
                    n = e.hasClass("js-assignee-picker-next") ? "": " is assigned",
                    $(".js-assignee-infobar-item-wrapper").html(function() {
                        var e, i;
                        return s ? "No one assigned": (i = $(t).find("input[type=radio]"), e = $(t).find(".js-select-menu-item-gravatar"), "" + e.html() + " <a href='/" + i.val(      ) + "' class='assignee css-truncate-target'>" + i.val() + "</a>" + n)
                    })
                }
            } (this))
        })


        var t = $("#issues_list")
        e = function() {
            return $.pjax.reload(t)
        }
        if(!t.length)
            return
        t.on("change", ".js-issues-list-select-all", function() {
            var e, n;
            return e = this.checked,
            n = e ? ":not(:checked)": ":checked",
            t.find(".select-toggle-check" + n).prop("checked", e).trigger("change"),
            t.find(".js-mass-assign-button").toggleClass("disabled", !e),
            this.indeterminate = !1
        });
        t.on("click", ".js-issues-list-close", function() {
            var n;
            return $.ajax({
                type: "PUT",
                url: $(this).attr("data-url"),
                data: {
                    issues: function() {
                        var e, s, i, r;
                        for (i = t.find(".js-issues-list :checked"), r = [], e = 0, s = i.length; s > e; e++) {
                            n = i[e];
                            if($(n).hasClass('js-issues-list-select-all'))
                                continue;
                            r.push($(n).val());
                        }

                        return r
                    } ()
                },
                success: e
            }),
            !1
        })

    })

})(jQuery );