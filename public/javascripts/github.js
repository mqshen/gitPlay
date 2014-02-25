function defineNetwork(t) {
    var e = function(t, e, n) {
        this.container = t,
        this.width = e,
        this.height = n,
        this.loaderInterval = null,
        this.loaderOffset = 0,
        this.ctx = this.initCanvas(t, e, n),
        this.startLoader("Loading graph data"),
        this.loadMeta()
    };
    return e.prototype = {
        initCanvas: function(e) {
            var n = t(e).find("canvas")[0];
            n.style.zIndex = "0";
            var s = n.width,
            i = n.height,
            r = n.getContext("2d"),
            a = window.devicePixelRatio || 1,
            o = r.webkitBackingStorePixelRatio || r.mozBackingStorePixelRatio || r.msBackingStorePixelRatio || r.oBackingStorePixelRatio || r.backingStorePixelRatio || 1,
            c = a / o;
            return 1 === c ? r: (n.width = s * c, n.height = i * c, n.style.width = s + "px", n.style.height = i + "px", r.scale(c, c), r)
        },
        startLoader: function(t) {
            this.ctx.save(),
            this.ctx.font = "14px Monaco, monospace",
            this.ctx.fillStyle = "#cacaca",
            this.ctx.textAlign = "center",
            this.ctx.fillText(t, this.width / 2, 155),
            this.ctx.restore(),
            this.displayLoader()
        },
        stopLoader: function() {
            t(".large-loading-area").hide()
        },
        displayLoader: function() {
            t(".large-loading-area").show()
        },
        loadMeta: function() {
            var e = this;
            e.loaded = !1,
            t.smartPoller(function(n) {
                t.ajax({
                    url: "network_meta",
                    success: function(s) {
                        s && s.nethash ? (e.loaded = !0, t(".js-network-poll").hide(), t(".js-network-current").show(), e.init(s)) : n()
                    }
                })
            })
        },
        init: function(t) {
            this.focus = t.focus,
            this.nethash = t.nethash,
            this.spaceMap = t.spacemap,
            this.userBlocks = t.blocks,
            this.commits = [];
            for (var n = 0; n < t.dates.length; n++) this.commits.push(new e.Commit(n, t.dates[n]));
            this.users = {};
            for (var n = 0; n < t.users.length; n++) {
                var s = t.users[n];
                this.users[s.name] = s
            }
            this.chrome = new e.Chrome(this, this.ctx, this.width, this.height, this.focus, this.commits, this.userBlocks, this.users),
            this.graph = new e.Graph(this, this.ctx, this.width, this.height, this.focus, this.commits, this.users, this.spaceMap, this.userBlocks, this.nethash),
            this.mouseDriver = new e.MouseDriver(this.container, this.chrome, this.graph),
            this.keyDriver = new e.KeyDriver(this.container, this.chrome, this.graph),
            this.stopLoader(),
            this.graph.drawBackground(),
            this.chrome.draw(),
            this.graph.requestInitialChunk()
        },
        initError: function() {
            this.stopLoader(),
            this.ctx.clearRect(0, 0, this.width, this.height),
            this.startLoader("Graph could not be drawn due to a network IO problem.")
        }
    },
    e.Commit = function(t, e) {
        this.time = t,
        this.date = moment(e, "YYYY-MM-DD HH:mm:ss"),
        this.requested = null,
        this.populated = null
    },
    e.Commit.prototype = {
        populate: function(t, e, n) {
            this.user = e,
            this.author = t.author,
            this.date = moment(t.date, "YYYY-MM-DD HH:mm:ss"),
            this.gravatar = t.gravatar,
            this.id = t.id,
            this.login = t.login,
            this.message = t.message,
            this.space = t.space,
            this.time = t.time,
            this.parents = this.populateParents(t.parents, n),
            this.requested = !0,
            this.populated = new Date
        },
        populateParents: function(t, e) {
            for (var n = [], s = 0; s < t.length; s++) {
                var i = t[s],
                r = e[i[1]];
                r.id = i[0],
                r.space = i[2],
                n.push(r)
            }
            return n
        }
    },
    e.Chrome = function(t, e, n, s, i, r, a, o) {
        this.namesWidth = 100,
        this.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        this.userBgColors = ["#EBEBFF", "#E0E0FF"],
        this.network = t,
        this.ctx = e,
        this.width = n,
        this.height = s,
        this.commits = r,
        this.userBlocks = a,
        this.users = o,
        this.offsetX = this.namesWidth + (n - this.namesWidth) / 2 - 20 * i,
        this.offsetY = 0,
        this.contentHeight = this.calcContentHeight(),
        this.graphMidpoint = this.namesWidth + (n - this.namesWidth) / 2,
        this.activeUser = null
    },
    e.Chrome.prototype = {
        moveX: function(t) {
            this.offsetX += t,
            this.offsetX > this.graphMidpoint ? this.offsetX = this.graphMidpoint: this.offsetX < this.graphMidpoint - 20 * this.commits.length && (this.offsetX = this.graphMidpoint - 20 * this.commits.length)
        },
        moveY: function(t) {
            this.offsetY += t,
            this.offsetY > 0 || this.contentHeight < this.height - 40 ? this.offsetY = 0 : this.offsetY < -this.contentHeight + this.height / 2 && (this.offsetY = -this.contentHeight + this.height / 2)
        },
        calcContentHeight: function() {
            for (var t = 0,
            e = 0; e < this.userBlocks.length; e++) {
                var n = this.userBlocks[e];
                t += n.count
            }
            return 20 * t
        },
        hover: function(t, e) {
            for (var n = 0; n < this.userBlocks.length; n++) {
                var s = this.userBlocks[n];
                if (t > 0 && t < this.namesWidth && e > 40 + this.offsetY + 20 * s.start && e < 40 + this.offsetY + 20 * (s.start + s.count)) return this.users[s.name]
            }
            return null
        },
        draw: function() {
            this.drawTimeline(this.ctx),
            this.drawUsers(this.ctx),
            this.drawFooter(this.ctx)
        },
        drawTimeline: function(t) {
            t.fillStyle = "#111111",
            t.fillRect(0, 0, this.width, 20),
            t.fillStyle = "#333333",
            t.fillRect(0, 20, this.width, 20);
            var e = parseInt((0 - this.offsetX) / 20);
            0 > e && (e = 0);
            var n = e + parseInt(this.width / 20);
            n > this.commits.length && (n = this.commits.length),
            t.save(),
            t.translate(this.offsetX, 0),
            t.font = "10px Helvetica, sans-serif";
            for (var s = null,
            i = null,
            r = e; n > r; r++) {
                var a = this.commits[r],
                o = this.months[a.date.month()];
                o != s && (t.fillStyle = "#ffffff", t.fillText(o, 20 * r - 3, 14), s = o);
                var c = parseInt(a.date.date());
                c != i && (t.fillStyle = "#ffffff", t.fillText(c, 20 * r - 3, 33), i = c)
            }
            t.restore()
        },
        drawUsers: function(t) {
            t.fillStyle = "#FFFFFF",
            t.fillRect(0, 0, this.namesWidth, this.height),
            t.save(),
            t.translate(0, 40 + this.offsetY);
            for (var e = 0; e < this.userBlocks.length; e++) {
                var n = this.userBlocks[e];
                t.fillStyle = this.userBgColors[e % 2],
                t.fillRect(0, 20 * n.start, this.namesWidth, 20 * n.count),
                this.activeUser && this.activeUser.name == n.name && (t.fillStyle = "rgba(0, 0, 0, 0.05)", t.fillRect(0, 20 * n.start, this.namesWidth, 20 * n.count)),
                t.fillStyle = "#DDDDDD",
                t.fillRect(0, 20 * n.start, 1, 20 * n.count),
                t.fillRect(this.namesWidth - 1, 20 * n.start, 1, 20 * n.count),
                t.fillRect(this.width - 1, 20 * n.start, 1, 20 * n.count),
                t.fillRect(0, 20 * (n.start + n.count) - 1, this.namesWidth, 1),
                t.measureText(n.name).width;
                var s = 20 * (n.start + n.count / 2) + 3;
                t.fillStyle = "#000000",
                t.font = "12px Monaco, monospace",
                t.textAlign = "center",
                t.fillText(n.name, this.namesWidth / 2, s, 96)
            }
            t.restore(),
            t.fillStyle = "#111111",
            t.fillRect(0, 0, this.namesWidth, 20),
            t.fillStyle = "#333333",
            t.fillRect(0, 20, this.namesWidth, 20)
        },
        drawFooter: function(t) {
            t.fillStyle = "#F4F4F4",
            t.fillRect(0, this.height - 20, this.width, 20),
            t.fillStyle = "#CCCCCC",
            t.fillRect(0, this.height - 20, this.width, 1),
            t.fillStyle = "#000000",
            t.font = "11px Monaco, monospace",
            t.fillText("GitHub Network Graph Viewer v4.0.0", 5, this.height - 5)
        }
    },
    e.Graph = function(t, e, n, s, i, r, a, o, c, l) {
        this.namesWidth = 100,
        this.spaceColors = [],
        this.bgColors = ["#F5F5FF", "#F0F0FF"],
        this.spaceColors.push("#FF0000"),
        this.spaceColors.push("#0000FF"),
        this.spaceColors.push("#00FF00"),
        this.spaceColors.push("#FF00FF"),
        this.spaceColors.push("#E2EB00"),
        this.spaceColors.push("#FFA600"),
        this.spaceColors.push("#00FFFC"),
        this.spaceColors.push("#DD458E"),
        this.spaceColors.push("#AD7331"),
        this.spaceColors.push("#97AD31"),
        this.spaceColors.push("#51829D"),
        this.spaceColors.push("#70387F"),
        this.spaceColors.push("#740000"),
        this.spaceColors.push("#745C00"),
        this.spaceColors.push("#419411"),
        this.spaceColors.push("#37BE8C"),
        this.spaceColors.push("#6C5BBD"),
        this.spaceColors.push("#F300AA"),
        this.spaceColors.push("#586D41"),
        this.spaceColors.push("#3B4E31"),
        this.network = t,
        this.ctx = e,
        this.width = n,
        this.height = s,
        this.focus = i,
        this.commits = r,
        this.users = a,
        this.spaceMap = o,
        this.userBlocks = c,
        this.nethash = l,
        this.offsetX = this.namesWidth + (n - this.namesWidth) / 2 - 20 * i,
        this.offsetY = 0,
        this.bgCycle = 0,
        this.marginMap = {},
        this.gravatars = {},
        this.activeCommit = null,
        this.contentHeight = this.calcContentHeight(),
        this.graphMidpoint = this.namesWidth + (n - this.namesWidth) / 2,
        this.showRefs = !0,
        this.lastHotLoadCenterIndex = null,
        this.connectionMap = {},
        this.spaceUserMap = {};
        for (var u = 0; u < c.length; u++) for (var d = c[u], h = d.start; h < d.start + d.count; h++) this.spaceUserMap[h] = a[d.name];
        this.headsMap = {};
        for (var u = 0; u < c.length; u++) for (var d = c[u], f = a[d.name], h = 0; h < f.heads.length; h++) {
            var m = f.heads[h];
            this.headsMap[m.id] || (this.headsMap[m.id] = []);
            var p = {
                name: f.name,
                head: m
            };
            this.headsMap[m.id].push(p)
        }
    },
    e.Graph.prototype = {
        moveX: function(t) {
            this.offsetX += t,
            this.offsetX > this.graphMidpoint ? this.offsetX = this.graphMidpoint: this.offsetX < this.graphMidpoint - 20 * this.commits.length && (this.offsetX = this.graphMidpoint - 20 * this.commits.length),
            this.hotLoadCommits()
        },
        moveY: function(t) {
            this.offsetY += t,
            this.offsetY > 0 || this.contentHeight < this.height - 40 ? this.offsetY = 0 : this.offsetY < -this.contentHeight + this.height / 2 && (this.offsetY = -this.contentHeight + this.height / 2)
        },
        toggleRefs: function() {
            this.showRefs = !this.showRefs
        },
        calcContentHeight: function() {
            for (var t = 0,
            e = 0; e < this.userBlocks.length; e++) {
                var n = this.userBlocks[e];
                t += n.count
            }
            return 20 * t
        },
        hover: function(t, e) {
            for (var n = this.timeWindow(), s = n.min; s <= n.max; s++) {
                var i = this.commits[s],
                r = this.offsetX + 20 * i.time,
                a = this.offsetY + 50 + 20 * i.space;
                if (t > r - 5 && r + 5 > t && e > a - 5 && a + 5 > e) return i
            }
            return null
        },
        hotLoadCommits: function() {
            var t = 200,
            e = parseInt(( - this.offsetX + this.graphMidpoint) / 20);
            if (0 > e && (e = 0), e > this.commits.length - 1 && (e = this.commits.length - 1), !(this.lastHotLoadCenterIndex && Math.abs(this.lastHotLoadCenterIndex - e) < 10)) {
                this.lastHotLoadCenterIndex = e;
                var n = this.backSpan(e, t),
                s = this.frontSpan(e, t);
                if (n || s) {
                    var i = n ? n[0] : s[0],
                    r = s ? s[1] : n[1];
                    this.requestChunk(i, r)
                }
            }
        },
        backSpan: function(t, e) {
            for (var n = null,
            s = t; s >= 0 && s > t - e; s--) if (!this.commits[s].requested) {
                n = s;
                break
            }
            if (null != n) {
                for (var i = null,
                r = null,
                s = n; s >= 0 && s > n - e; s--) if (this.commits[s].requested) {
                    i = s;
                    break
                }
                return i ? r = i + 1 : (r = n - e, 0 > r && (r = 0)),
                [r, n]
            }
            return null
        },
        frontSpan: function(t, e) {
            for (var n = null,
            s = t; s < this.commits.length && t + e > s; s++) if (!this.commits[s].requested) {
                n = s;
                break
            }
            if (null != n) {
                for (var i = null,
                r = null,
                s = n; s < this.commits.length && n + e > s; s++) if (this.commits[s].requested) {
                    i = s;
                    break
                }
                return r = i ? i - 1 : n + e >= this.commits.length ? this.commits.length - 1 : n + e,
                [n, r]
            }
            return null
        },
        requestInitialChunk: function() {
            var e = this;
            t.getJSON("network_data_chunk?nethash=" + this.nethash,
            function(t) {
                e.importChunk(t),
                e.draw(),
                e.network.chrome.draw()
            })
        },
        requestChunk: function(e, n) {
            for (var s = e; n >= s; s++) this.commits[s].requested = new Date;
            var i = this,
            r = "network_data_chunk?nethash=" + this.nethash + "&start=" + e + "&end=" + n;
            t.getJSON(r,
            function(t) {
                i.importChunk(t),
                i.draw(),
                i.network.chrome.draw(),
                i.lastHotLoadCenterIndex = this.focus
            })
        },
        importChunk: function(t) {
            if (t.commits) for (var e = 0; e < t.commits.length; e++) {
                var n = t.commits[e],
                s = this.spaceUserMap[n.space],
                i = this.commits[n.time];
                i.populate(n, s, this.commits);
                for (var r = 0; r < i.parents.length; r++) for (var a = i.parents[r], o = a.time + 1; o < i.time; o++) this.connectionMap[o] = this.connectionMap[o] || [],
                this.connectionMap[o].push(i)
            }
        },
        timeWindow: function() {
            var t = parseInt((this.namesWidth - this.offsetX + 20) / 20);
            0 > t && (t = 0);
            var e = t + parseInt((this.width - this.namesWidth) / 20);
            return e > this.commits.length - 1 && (e = this.commits.length - 1),
            {
                min: t,
                max: e
            }
        },
        draw: function() {
            this.drawBackground();
            var t = this.timeWindow(),
            e = t.min,
            n = t.max;
            this.ctx.save(),
            this.ctx.translate(this.offsetX, this.offsetY + 50);
            for (var s = {},
            i = 0; i < this.spaceMap.length; i++) for (var r = this.spaceMap.length - i - 1,
            a = e; n >= a; a++) {
                var o = this.commits[a];
                o.populated && o.space == r && (this.drawConnection(o), s[o.id] = !0)
            }
            for (var i = e; n >= i; i++) {
                var c = this.connectionMap[i];
                if (c) for (var a = 0; a < c.length; a++) {
                    var o = c[a];
                    s[o.id] || (this.drawConnection(o), s[o.id] = !0)
                }
            }
            for (var i = 0; i < this.spaceMap.length; i++) for (var r = this.spaceMap.length - i - 1,
            a = e; n >= a; a++) {
                var o = this.commits[a];
                o.populated && o.space == r && (o == this.activeCommit ? this.drawActiveCommit(o) : this.drawCommit(o))
            }
            if (this.showRefs) for (var a = e; n >= a; a++) {
                var o = this.commits[a];
                if (o.populated) {
                    var l = this.headsMap[o.id];
                    if (l) for (var u = 0,
                    d = 0; d < l.length; d++) {
                        var h = l[d];
                        if (this.spaceUserMap[o.space].name == h.name) {
                            var f = this.drawHead(o, h.head, u);
                            u += f
                        }
                    }
                }
            }
            this.ctx.restore(),
            this.activeCommit && this.drawCommitInfo(this.activeCommit)
        },
        drawBackground: function() {
            this.ctx.clearRect(0, 0, this.width, this.height),
            this.ctx.save(),
            this.ctx.translate(0, this.offsetY + 50),
            this.ctx.clearRect(0, -10, this.width, this.height);
            for (var t = 0; t < this.userBlocks.length; t++) {
                var e = this.userBlocks[t];
                this.ctx.fillStyle = this.bgColors[t % 2],
                this.ctx.fillRect(0, 20 * e.start - 10, this.width, 20 * e.count),
                this.ctx.fillStyle = "#DDDDDD",
                this.ctx.fillRect(0, 20 * (e.start + e.count) - 11, this.width, 1)
            }
            this.ctx.restore()
        },
        drawCommit: function(t) {
            var e = 20 * t.time;
            y = 20 * t.space,
            this.ctx.beginPath(),
            this.ctx.arc(e, y, 3, 0, 2 * Math.PI, !1),
            this.ctx.fillStyle = this.spaceColor(t.space),
            this.ctx.fill()
        },
        drawActiveCommit: function(t) {
            var e = 20 * t.time,
            n = 20 * t.space;
            this.ctx.beginPath(),
            this.ctx.arc(e, n, 6, 0, 2 * Math.PI, !1),
            this.ctx.fillStyle = this.spaceColor(t.space),
            this.ctx.fill()
        },
        drawCommitInfo: function(t) {
            var e = t.message ? this.splitLines(t.message, 54) : [],
            n = 80 + 15 * e.length,
            s = this.offsetX + 20 * t.time,
            i = 50 + this.offsetY + 20 * t.space,
            r = 0,
            a = 0;
            r = s < this.graphMidpoint ? s + 10 : s - 410,
            a = i < 40 + (this.height - 40) / 2 ? i + 10 : i - n - 10,
            this.ctx.save(),
            this.ctx.translate(r, a),
            this.ctx.fillStyle = "#FFFFFF",
            this.ctx.strokeStyle = "#000000",
            this.ctx.lineWidth = "2",
            this.ctx.beginPath(),
            this.ctx.moveTo(0, 5),
            this.ctx.quadraticCurveTo(0, 0, 5, 0),
            this.ctx.lineTo(395, 0),
            this.ctx.quadraticCurveTo(400, 0, 400, 5),
            this.ctx.lineTo(400, n - 5),
            this.ctx.quadraticCurveTo(400, n, 395, n),
            this.ctx.lineTo(5, n),
            this.ctx.quadraticCurveTo(0, n, 0, n - 5),
            this.ctx.lineTo(0, 5),
            this.ctx.fill(),
            this.ctx.stroke();
            var o = this.gravatars[t.gravatar];
            if (o) this.drawGravatar(o, 10, 10);
            else {
                var c = this;
                window.location.protocol,
                o = new Image,
                o.src = t.gravatar,
                o.onload = function() {
                    c.activeCommit == t && (c.drawGravatar(o, r + 10, a + 10), c.gravatars[t.gravatar] = o)
                }
            }
            this.ctx.fillStyle = "#000000",
            this.ctx.font = "bold 14px Helvetica, sans-serif",
            this.ctx.fillText(t.author, 55, 32),
            this.ctx.fillStyle = "#888888",
            this.ctx.font = "12px Monaco, monospace",
            this.ctx.fillText(t.id, 12, 65),
            this.drawMessage(e, 12, 85),
            this.ctx.restore()
        },
        drawGravatar: function(t, e, n) {
            this.ctx.strokeStyle = "#AAAAAA",
            this.ctx.lineWidth = 1,
            this.ctx.beginPath(),
            this.ctx.strokeRect(e + .5, n + .5, 35, 35),
            this.ctx.drawImage(t, e + 2, n + 2, 32, 32)
        },
        drawMessage: function(t, e, n) {
            this.ctx.font = "12px Monaco, monospace",
            this.ctx.fillStyle = "#000000";
            for (var s = 0; s < t.length; s++) {
                var i = t[s];
                this.ctx.fillText(i, e, n + 15 * s)
            }
        },
        splitLines: function(t, e) {
            for (var n = t.split(" "), s = [], i = "", r = 0; r < n.length; r++) {
                var a = n[r];
                i.length + 1 + a.length < e ? i = "" == i ? a: i + " " + a: (s.push(i), i = a)
            }
            return s.push(i),
            s
        },
        drawHead: function(t, e, n) {
            this.ctx.font = "10.25px Monaco, monospace",
            this.ctx.save();
            var s = this.ctx.measureText(e.name).width;
            this.ctx.restore();
            var i = 20 * t.time,
            r = 20 * t.space + 5 + n;
            return this.ctx.save(),
            this.ctx.translate(i, r),
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)",
            this.ctx.beginPath(),
            this.ctx.moveTo(0, 0),
            this.ctx.lineTo( - 4, 10),
            this.ctx.quadraticCurveTo( - 9, 10, -9, 15),
            this.ctx.lineTo( - 9, 15 + s),
            this.ctx.quadraticCurveTo( - 9, 15 + s + 5, -4, 15 + s + 5),
            this.ctx.lineTo(4, 15 + s + 5),
            this.ctx.quadraticCurveTo(9, 15 + s + 5, 9, 15 + s),
            this.ctx.lineTo(9, 15),
            this.ctx.quadraticCurveTo(9, 10, 4, 10),
            this.ctx.lineTo(0, 0),
            this.ctx.fill(),
            this.ctx.fillStyle = "#FFFFFF",
            this.ctx.font = "12px Monaco, monospace",
            this.ctx.textBaseline = "middle",
            this.ctx.scale(.85, .85),
            this.ctx.rotate(Math.PI / 2),
            this.ctx.fillText(e.name, 17, -1),
            this.ctx.restore(),
            s + 20
        },
        drawConnection: function(t) {
            for (var e = 0; e < t.parents.length; e++) {
                var n = t.parents[e];
                0 == e ? n.space == t.space ? this.drawBasicConnection(n, t) : this.drawBranchConnection(n, t) : this.drawMergeConnection(n, t)
            }
        },
        drawBasicConnection: function(t, e) {
            var n = this.spaceColor(e.space);
            this.ctx.strokeStyle = n,
            this.ctx.lineWidth = 2,
            this.ctx.beginPath(),
            this.ctx.moveTo(20 * t.time, 20 * e.space),
            this.ctx.lineTo(20 * e.time, 20 * e.space),
            this.ctx.stroke()
        },
        drawBranchConnection: function(t, e) {
            var n = this.spaceColor(e.space);
            this.ctx.strokeStyle = n,
            this.ctx.lineWidth = 2,
            this.ctx.beginPath(),
            this.ctx.moveTo(20 * t.time, 20 * t.space),
            this.ctx.lineTo(20 * t.time, 20 * e.space),
            this.ctx.lineTo(20 * e.time - 14, 20 * e.space),
            this.ctx.stroke(),
            this.threeClockArrow(n, 20 * e.time, 20 * e.space)
        },
        drawMergeConnection: function(t, e) {
            var n = this.spaceColor(t.space);
            if (this.ctx.strokeStyle = n, this.ctx.lineWidth = 2, this.ctx.beginPath(), t.space > e.space) {
                this.ctx.moveTo(20 * t.time, 20 * t.space);
                var s = this.safePath(t.time, e.time, t.space);
                if (s) this.ctx.lineTo(20 * e.time - 10, 20 * t.space),
                this.ctx.lineTo(20 * e.time - 10, 20 * e.space + 15),
                this.ctx.lineTo(20 * e.time - 7.7, 20 * e.space + 9.5),
                this.ctx.stroke(),
                this.oneClockArrow(n, 20 * e.time, 20 * e.space);
                else {
                    var i = this.closestMargin(t.time, e.time, t.space, -1);
                    t.space == e.space + 1 && t.space == i + 1 ? (this.ctx.lineTo(20 * t.time, 20 * i + 10), this.ctx.lineTo(20 * e.time - 15, 20 * i + 10), this.ctx.lineTo(20 * e.time - 9.5, 20 * i + 7.7), this.ctx.stroke(), this.twoClockArrow(n, 20 * e.time, 20 * i), this.addMargin(t.time, e.time, i)) : t.time + 1 == e.time ? (i = this.closestMargin(t.time, e.time, e.space, 0), this.ctx.lineTo(20 * t.time, 20 * i + 10), this.ctx.lineTo(20 * e.time - 15, 20 * i + 10), this.ctx.lineTo(20 * e.time - 15, 20 * e.space + 10), this.ctx.lineTo(20 * e.time - 9.5, 20 * e.space + 7.7), this.ctx.stroke(), this.twoClockArrow(n, 20 * e.time, 20 * e.space), this.addMargin(t.time, e.time, i)) : (this.ctx.lineTo(20 * t.time + 10, 20 * t.space - 10), this.ctx.lineTo(20 * t.time + 10, 20 * i + 10), this.ctx.lineTo(20 * e.time - 10, 20 * i + 10), this.ctx.lineTo(20 * e.time - 10, 20 * e.space + 15), this.ctx.lineTo(20 * e.time - 7.7, 20 * e.space + 9.5), this.ctx.stroke(), this.oneClockArrow(n, 20 * e.time, 20 * e.space), this.addMargin(t.time, e.time, i))
                }
            } else {
                var i = this.closestMargin(t.time, e.time, e.space, -1);
                i < e.space ? (this.ctx.moveTo(20 * t.time, 20 * t.space), this.ctx.lineTo(20 * t.time, 20 * i + 10), this.ctx.lineTo(20 * e.time - 12.7, 20 * i + 10), this.ctx.lineTo(20 * e.time - 12.7, 20 * e.space - 10), this.ctx.lineTo(20 * e.time - 9.4, 20 * e.space - 7.7), this.ctx.stroke(), this.fourClockArrow(n, 20 * e.time, 20 * e.space), this.addMargin(t.time, e.time, i)) : (this.ctx.moveTo(20 * t.time, 20 * t.space), this.ctx.lineTo(20 * t.time, 20 * i + 10), this.ctx.lineTo(20 * e.time - 12.7, 20 * i + 10), this.ctx.lineTo(20 * e.time - 12.7, 20 * e.space + 10), this.ctx.lineTo(20 * e.time - 9.4, 20 * e.space + 7.7), this.ctx.stroke(), this.twoClockArrow(n, 20 * e.time, 20 * e.space), this.addMargin(t.time, e.time, i))
            }
        },
        addMargin: function(t, e, n) {
            var s = n;
            this.marginMap[s] || (this.marginMap[s] = []),
            this.marginMap[s].push([t, e])
        },
        oneClockArrow: function(t, e, n) {
            this.ctx.fillStyle = t,
            this.ctx.beginPath(),
            this.ctx.moveTo(e - 6.3, n + 13.1),
            this.ctx.lineTo(e - 10.8, n + 9.7),
            this.ctx.lineTo(e - 2.6, n + 3.5),
            this.ctx.fill()
        },
        twoClockArrow: function(t, e, n) {
            this.ctx.fillStyle = t,
            this.ctx.beginPath(),
            this.ctx.moveTo(e - 12.4, n + 6.6),
            this.ctx.lineTo(e - 9.3, n + 10.6),
            this.ctx.lineTo(e - 3.2, n + 2.4),
            this.ctx.fill()
        },
        threeClockArrow: function(t, e, n) {
            this.ctx.fillStyle = t,
            this.ctx.beginPath(),
            this.ctx.moveTo(e - 14, n - 2.5),
            this.ctx.lineTo(e - 14, n + 2.5),
            this.ctx.lineTo(e - 4, n),
            this.ctx.fill()
        },
        fourClockArrow: function(t, e, n) {
            this.ctx.fillStyle = t,
            this.ctx.beginPath(),
            this.ctx.moveTo(e - 12.4, n - 6.6),
            this.ctx.lineTo(e - 9.3, n - 10.6),
            this.ctx.lineTo(e - 3.2, n - 2.4),
            this.ctx.fill()
        },
        safePath: function(t, e, n) {
            for (var s = 0; s < this.spaceMap[n].length; s++) {
                var i = this.spaceMap[n][s];
                if (this.timeInPath(t, i)) return i[1] == e
            }
            return ! 1
        },
        closestMargin: function(t, e, n, s) {
            for (var i = this.spaceMap.length,
            r = s,
            a = !1,
            o = !1,
            c = !1; ! o || !a;) {
                if (n + r >= 0 && this.safeMargin(t, e, n + r)) return n + r;
                0 > n + r && (a = !0),
                n + r > i && (o = !0),
                0 == c && 0 == r ? (r = -1, c = !0) : r = 0 > r ? -r - 1 : -r - 2
            }
            return n > 0 ? n - 1 : 0
        },
        safeMargin: function(t, e, n) {
            var s = n;
            if (!this.marginMap[s]) return ! 0;
            for (var i = this.marginMap[s], r = 0; r < i.length; r++) {
                var a = i[r];
                if (this.pathsCollide([t, e], a)) return ! 1
            }
            return ! 0
        },
        pathsCollide: function(t, e) {
            return this.timeWithinPath(t[0], e) || this.timeWithinPath(t[1], e) || this.timeWithinPath(e[0], t) || this.timeWithinPath(e[1], t)
        },
        timeInPath: function(t, e) {
            return t >= e[0] && t <= e[1]
        },
        timeWithinPath: function(t, e) {
            return t > e[0] && t < e[1]
        },
        spaceColor: function(t) {
            return 0 == t ? "#000000": this.spaceColors[t % this.spaceColors.length]
        }
    },
    e.MouseDriver = function(e, n, s) {
        this.container = e,
        this.chrome = n,
        this.graph = s,
        this.dragging = !1,
        this.lastPoint = {
            x: 0,
            y: 0
        },
        this.lastHoverCommit = null,
        this.lastHoverUser = null,
        this.pressedCommit = null,
        this.pressedUser = null;
        var i = t(e).eq(0),
        r = t("canvas", i)[0],
        a = t(r).offset();
        r.style.cursor = "move";
        var o = this;
        this.up = function() {
            o.dragging = !1,
            o.pressedCommit && o.graph.activeCommit == o.pressedCommit ? window.open("/" + o.graph.activeCommit.user.name + "/" + o.graph.activeCommit.user.repo + "/commit/" + o.graph.activeCommit.id) : o.pressedUser && o.chrome.activeUser == o.pressedUser && (window.location = "/" + o.chrome.activeUser.name + "/" + o.chrome.activeUser.repo + "/network"),
            o.pressedCommit = null,
            o.pressedUser = null
        },
        this.down = function() {
            o.graph.activeCommit ? o.pressedCommit = o.graph.activeCommit: o.chrome.activeUser ? o.pressedUser = o.chrome.activeUser: o.dragging = !0
        },
        this.docmove = function(t) {
            var e = t.pageX,
            n = t.pageY;
            o.dragging && (o.graph.moveX(e - o.lastPoint.x), o.graph.moveY(n - o.lastPoint.y), o.graph.draw(), o.chrome.moveX(e - o.lastPoint.x), o.chrome.moveY(n - o.lastPoint.y), o.chrome.draw()),
            o.lastPoint.x = e,
            o.lastPoint.y = n
        },
        this.move = function(t) {
            var e = t.pageX,
            n = t.pageY;
            if (o.dragging) o.graph.moveX(e - o.lastPoint.x),
            o.graph.moveY(n - o.lastPoint.y),
            o.graph.draw(),
            o.chrome.moveX(e - o.lastPoint.x),
            o.chrome.moveY(n - o.lastPoint.y),
            o.chrome.draw();
            else {
                var s = o.chrome.hover(e - a.left, n - a.top);
                if (s != o.lastHoverUser) r.style.cursor = s ? "pointer": "move",
                o.chrome.activeUser = s,
                o.chrome.draw(),
                o.lastHoverUser = s;
                else {
                    var i = o.graph.hover(e - a.left, n - a.top);
                    i != o.lastHoverCommit && (r.style.cursor = i ? "pointer": "move", o.graph.activeCommit = i, o.graph.draw(), o.chrome.draw(), o.lastHoverCommit = i)
                }
            }
            o.lastPoint.x = e,
            o.lastPoint.y = n
        },
        this.out = function() {
            o.graph.activeCommit = null,
            o.chrome.activeUser = null,
            o.graph.draw(),
            o.chrome.draw(),
            o.lastHoverCommit = null,
            o.lastHoverUser = null
        },
        t("body")[0].onmouseup = this.up,
        t("body")[0].onmousemove = this.docmove,
        r.onmousedown = this.down,
        r.onmousemove = this.move,
        r.onmouseout = this.out
    },
    e.KeyDriver = function(e, n, s) {
        this.container = e,
        this.chrome = n,
        this.graph = s,
        this.dirty = !1,
        this.moveBothX = function(t) {
            this.graph.moveX(t),
            this.chrome.moveX(t),
            this.graph.activeCommit = null,
            this.dirty = !0
        },
        this.moveBothY = function(t) {
            this.graph.moveY(t),
            this.chrome.moveY(t),
            this.graph.activeCommit = null,
            this.dirty = !0
        },
        this.toggleRefs = function() {
            this.graph.toggleRefs(),
            this.dirty = !0
        },
        this.redraw = function() {
            this.dirty && (this.graph.draw(), this.chrome.draw()),
            this.dirty = !1
        };
        var i = this;
        this.down = function(t) {
            var e = !1;
            if (t.target != document.body) return ! 0;
            if (t.shiftKey) switch (t.which) {
            case 37:
            case 72:
                i.moveBothX(999999),
                e = !0;
                break;
            case 38:
            case 75:
                i.moveBothY(999999),
                e = !0;
                break;
            case 39:
            case 76:
                i.moveBothX( - 999999),
                e = !0;
                break;
            case 40:
            case 74:
                i.moveBothY( - 999999),
                e = !0
            } else switch (t.which) {
            case 37:
            case 72:
                i.moveBothX(100),
                e = !0;
                break;
            case 38:
            case 75:
                i.moveBothY(20),
                e = !0;
                break;
            case 39:
            case 76:
                i.moveBothX( - 100),
                e = !0;
                break;
            case 40:
            case 74:
                i.moveBothY( - 20),
                e = !0;
                break;
            case 84:
                i.toggleRefs(),
                e = !0
            }
            e && i.redraw()
        },
        t(document).keydown(this.down)
    },
    e
} !
function() {
    top != window && (alert("For security reasons, framing is not allowed."), top.location.replace(document.location))
}.call(this),
function() {
    "github.com" === location.host && "https:" !== location.protocol && (alert("SSL is required to view this page."), location.protocol = "https:")
}.call(this),
function() {
    var t;
    null == window.GitHub && (window.GitHub = {}),
    t = null,
    GitHub.withSudo = function(e) {
        return $.getJSON("/sessions/in_sudo.json",
        function(n) {
            return n ? e() : (t = e, $.facebox({
                div: "#js-sudo-prompt"
            },
            "sudo"))
        })
    },
    $(document).on("ajaxSuccess", ".js-sudo-form",
    function() {
        return $(document).trigger("close.facebox"),
        "function" == typeof t && t(),
        t = null
    }),
    $(document).on("ajaxError", ".js-sudo-form",
    function() {
        return $(this).find(".js-sudo-error").text("Incorrect Password.").show(),
        $(this).find(".js-sudo-password").val(""),
        !1
    }),
    $(document).on("click", ".js-sudo-required",
    function() {
        return GitHub.withSudo(function(t) {
            return function() {
                return location.href = t.href
            }
        } (this)),
        !1
    })
}.call(this),
function() {
    null == window.GitHub && (window.GitHub = {})
}.call(this),
function(t) {
    t.fn.autocompleteField = function(e) {
        var n = t.extend({
            searchVar: "q",
            url: null,
            delay: 250,
            useCache: !1,
            extraParams: {},
            autoClearResults: !0,
            dataType: "html",
            minLength: 1
        },
        e);
        return t(this).each(function() {
            function e(e) {
                if (i && i.readyState < 4 && i.abort(), n.useCache && c.hasOwnProperty(e)) o.trigger("autocomplete:finish", c[e]);
                else {
                    var s = {};
                    s[n.searchVar] = e,
                    s = t.extend(!0, n.extraParams, s),
                    o.trigger("autocomplete:beforesend"),
                    i = t.get(n.url, s,
                    function(t) {
                        n.useCache && (c[e] = t),
                        o.val() === e && o.trigger("autocomplete:finish", t)
                    },
                    n.dataType)
                }
            }
            function s(t) {
                t.length >= n.minLength ? a != t && (e(t), a = t) : o.trigger("autocomplete:clear")
            }
            var i, r, a, o = t(this),
            c = {};
            null != n.url && (o.attr("autocomplete", "off"), o.keyup(function(t) {
                t.preventDefault(),
                clearTimeout(r),
                r = setTimeout(function() {
                    clearTimeout(r),
                    s(o.val())
                },
                n.delay)
            }), o.blur(function() {
                a = null
            }))
        })
    }
} (jQuery),
function(t) {
    t.fn.caret = function(t) {
        return "undefined" == typeof t ? this[0].selectionStart: (this[0].focus(), this[0].setSelectionRange(t, t))
    },
    t.fn.caretSelection = function(t, e) {
        return "undefined" == typeof t && "undefined" == typeof e ? [this[0].selectionStart, this[0].selectionEnd] : (this[0].focus(), this[0].setSelectionRange(t, e))
    }
} (jQuery),
DateInput = function(t) {
    function e(n, s) {
        "object" != typeof s && (s = {}),
        t.extend(this, e.DEFAULT_OPTS, s),
        this.input = t(n),
        this.bindMethodsToObj("show", "hide", "hideIfClickOutside", "keydownHandler", "selectDate"),
        this.build(),
        this.selectDate(),
        this.show(),
        this.input.hide(),
        this.input.data("datePicker", this)
    }
    return e.DEFAULT_OPTS = {
        month_names: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        short_month_names: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        short_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        start_of_week: 1
    },
    e.prototype = {
        build: function() {
            var e = t('<p class="month_nav"><span class="button prev" title="[Page-Up]">&#171;</span> <span class="month_name"></span> <span class="button next" title="[Page-Down]">&#187;</span></p>');
            this.monthNameSpan = t(".month_name", e),
            t(".prev", e).click(this.bindToObj(function() {
                this.moveMonthBy( - 1)
            })),
            t(".next", e).click(this.bindToObj(function() {
                this.moveMonthBy(1)
            }));
            var n = t('<p class="year_nav"><span class="button prev" title="[Ctrl+Page-Up]">&#171;</span> <span class="year_name"></span> <span class="button next" title="[Ctrl+Page-Down]">&#187;</span></p>');
            this.yearNameSpan = t(".year_name", n),
            t(".prev", n).click(this.bindToObj(function() {
                this.moveMonthBy( - 12)
            })),
            t(".next", n).click(this.bindToObj(function() {
                this.moveMonthBy(12)
            }));
            var s = t('<div class="nav"></div>').append(e, n),
            i = "<table><thead><tr>";
            t(this.adjustDays(this.short_day_names)).each(function() {
                i += "<th>" + this + "</th>"
            }),
            i += "</tr></thead><tbody></tbody></table>",
            this.dateSelector = this.rootLayers = t('<div class="date_selector no_shadow"></div>').append(s, i).insertAfter(this.input),
            this.tbody = t("tbody", this.dateSelector),
            this.input.change(this.bindToObj(function() {
                this.selectDate()
            })),
            this.selectDate()
        },
        selectMonth: function(e) {
            var n = new Date(e.getFullYear(), e.getMonth(), 1);
            if (!this.currentMonth || this.currentMonth.getFullYear() != n.getFullYear() || this.currentMonth.getMonth() != n.getMonth()) {
                this.currentMonth = n;
                for (var s = this.rangeStart(e), i = this.rangeEnd(e), r = this.daysBetween(s, i), a = "", o = 0; r >= o; o++) {
                    var c = new Date(s.getFullYear(), s.getMonth(), s.getDate() + o, 12, 0);
                    this.isFirstDayOfWeek(c) && (a += "<tr>"),
                    a += c.getMonth() == e.getMonth() ? '<td class="selectable_day" date="' + this.dateToString(c) + '">' + c.getDate() + "</td>": '<td class="unselected_month" date="' + this.dateToString(c) + '">' + c.getDate() + "</td>",
                    this.isLastDayOfWeek(c) && (a += "</tr>")
                }
                this.tbody.empty().append(a),
                this.monthNameSpan.empty().append(this.monthName(e)),
                this.yearNameSpan.empty().append(this.currentMonth.getFullYear()),
                t(".selectable_day", this.tbody).click(this.bindToObj(function(e) {
                    this.changeInput(t(e.target).attr("date"))
                })),
                t("td[date='" + this.dateToString(new Date) + "']", this.tbody).addClass("today"),
                t("td.selectable_day", this.tbody).mouseover(function() {
                    t(this).addClass("hover")
                }),
                t("td.selectable_day", this.tbody).mouseout(function() {
                    t(this).removeClass("hover")
                })
            }
            t(".selected", this.tbody).removeClass("selected"),
            t('td[date="' + this.selectedDateString + '"]', this.tbody).addClass("selected")
        },
        selectDate: function(t) {
            "undefined" == typeof t && (t = this.stringToDate(this.input.val())),
            t || (t = new Date),
            this.selectedDate = t,
            this.selectedDateString = this.dateToString(this.selectedDate),
            this.selectMonth(this.selectedDate)
        },
        resetDate: function() {
            t(".selected", this.tbody).removeClass("selected"),
            this.changeInput("")
        },
        changeInput: function(t) {
            this.input.val(t).change(),
            this.hide()
        },
        show: function() {
            this.rootLayers.css("display", "block"),
            t([window, document.body]).click(this.hideIfClickOutside),
            this.input.unbind("focus", this.show),
            this.rootLayers.keydown(this.keydownHandler),
            this.setPosition()
        },
        hide: function() {},
        hideIfClickOutside: function(t) {
            t.target == this.input[0] || this.insideSelector(t) || this.hide()
        },
        insideSelector: function(e) {
            return $target = t(e.target),
            $target.parents(".date_selector").length || $target.is(".date_selector")
        },
        keydownHandler: function(t) {
            switch (t.keyCode) {
            case 9:
            case 27:
                return this.hide(),
                void 0;
            case 13:
                this.changeInput(this.selectedDateString);
                break;
            case 33:
                this.moveDateMonthBy(t.ctrlKey ? -12 : -1);
                break;
            case 34:
                this.moveDateMonthBy(t.ctrlKey ? 12 : 1);
                break;
            case 38:
                this.moveDateBy( - 7);
                break;
            case 40:
                this.moveDateBy(7);
                break;
            case 37:
                this.moveDateBy( - 1);
                break;
            case 39:
                this.moveDateBy(1);
                break;
            default:
                return
            }
            t.preventDefault()
        },
        stringToDate: function(t) {
            var e;
            return (e = t.match(/^(\d{1,2}) ([^\s]+) (\d{4,4})$/)) ? new Date(e[3], this.shortMonthNum(e[2]), e[1], 12, 0) : null
        },
        dateToString: function(t) {
            return t.getDate() + " " + this.short_month_names[t.getMonth()] + " " + t.getFullYear()
        },
        setPosition: function() {
            var t = this.input.offset();
            this.rootLayers.css({
                top: t.top + this.input.outerHeight(),
                left: t.left
            }),
            this.ieframe && this.ieframe.css({
                width: this.dateSelector.outerWidth(),
                height: this.dateSelector.outerHeight()
            })
        },
        moveDateBy: function(t) {
            var e = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate() + t);
            this.selectDate(e)
        },
        moveDateMonthBy: function(t) {
            var e = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + t, this.selectedDate.getDate());
            e.getMonth() == this.selectedDate.getMonth() + t + 1 && e.setDate(0),
            this.selectDate(e)
        },
        moveMonthBy: function(t) {
            var e = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + t, this.currentMonth.getDate());
            this.selectMonth(e)
        },
        monthName: function(t) {
            return this.month_names[t.getMonth()]
        },
        bindToObj: function(t) {
            var e = this;
            return function() {
                return t.apply(e, arguments)
            }
        },
        bindMethodsToObj: function() {
            for (var t = 0; t < arguments.length; t++) this[arguments[t]] = this.bindToObj(this[arguments[t]])
        },
        indexFor: function(t, e) {
            for (var n = 0; n < t.length; n++) if (e == t[n]) return n
        },
        monthNum: function(t) {
            return this.indexFor(this.month_names, t)
        },
        shortMonthNum: function(t) {
            return this.indexFor(this.short_month_names, t)
        },
        shortDayNum: function(t) {
            return this.indexFor(this.short_day_names, t)
        },
        daysBetween: function(t, e) {
            return t = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()),
            e = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()),
            (e - t) / 864e5
        },
        changeDayTo: function(t, e, n) {
            var s = n * (Math.abs(e.getDay() - t - 7 * n) % 7);
            return new Date(e.getFullYear(), e.getMonth(), e.getDate() + s)
        },
        rangeStart: function(t) {
            return this.changeDayTo(this.start_of_week, new Date(t.getFullYear(), t.getMonth()), -1)
        },
        rangeEnd: function(t) {
            return this.changeDayTo((this.start_of_week - 1) % 7, new Date(t.getFullYear(), t.getMonth() + 1, 0), 1)
        },
        isFirstDayOfWeek: function(t) {
            return t.getDay() == this.start_of_week
        },
        isLastDayOfWeek: function(t) {
            return t.getDay() == (this.start_of_week - 1) % 7
        },
        adjustDays: function(t) {
            for (var e = [], n = 0; n < t.length; n++) e[n] = t[(n + this.start_of_week) % 7];
            return e
        }
    },
    e
} (jQuery),
function(t) {
    t.fn.errorify = function(e, n) {
        return t.extend({},
        t.fn.errorify.defaults, n),
        this.each(function() {
            var n = t(this);
            n.removeClass("warn"),
            n.addClass("errored"),
            n.find("p.note").hide(),
            n.find("dd.error").remove(),
            n.find("dd.warning").remove();
            var s = t("<dd>").addClass("error").text(e);
            n.append(s)
        })
    },
    t.fn.errorify.defaults = {},
    t.fn.unErrorify = function(e) {
        return t.extend({},
        t.fn.unErrorify.defaults, e),
        this.each(function() {
            var e = t(this);
            e.removeClass("errored warn"),
            e.find("p.note").show(),
            e.find("dd.error").remove(),
            e.find("dd.warning").remove()
        })
    },
    t.fn.unErrorify.defaults = {}
} (jQuery),
$.fn.selectableList = function(t, e) {
    return $(this).each(function() {
        var n = $(this),
        s = $.extend({
            toggleClassName: "selected",
            wrapperSelector: "a",
            mutuallyExclusive: !1,
            itemParentSelector: "li",
            enableShiftSelect: !1,
            ignoreLinks: !1
        },
        e);
        return n.delegate(t + " " + s.itemParentSelector + " " + s.wrapperSelector, "click",
        function(e) {
            if (e.which > 1 || e.metaKey || s.ignoreLinks && $(e.target).closest("a").length) return ! 0;
            var i = $(this),
            r = i.find(":checkbox, :radio"),
            a = n.find(t + " ." + s.toggleClassName),
            o = n.find(t + " *[data-last]");
            if (i.is(":checkbox, :radio") || e.target == r[0] || (r.prop("checked") && !r.is(":radio") ? r.prop("checked", !1) : r.prop("checked", !0)), s.mutuallyExclusive && a.removeClass(s.toggleClassName), i.toggleClass(s.toggleClassName), r.change(), s.enableShiftSelect && e.shiftKey && a.length > 0) {
                if (o.length > 0) {
                    var c = o.offset().top,
                    l = i.offset().top,
                    u = "#" + i.attr("id"),
                    d = $,
                    h = $,
                    f = $;
                    c > l ? d = o.prevUntil(u) : l > c && (d = o.nextUntil(u)),
                    h = d.find(":checkbox"),
                    f = d.find(":checked"),
                    f.length == h.length ? (d.removeClass(s.toggleClassName), h.prop("checked", !1)) : (d.addClass(s.toggleClassName), h.prop("checked", !0))
                }
                i.trigger("selectableList:shiftClicked")
            }
            o.removeAttr("data-last"),
            i.attr("data-last", !0)
        }),
        n.delegate(t + " li :checkbox," + t + " li :radio", "change",
        function() {
            var e = $(this),
            i = e.closest(s.wrapperSelector);
            s.mutuallyExclusive && n.find(t + " ." + s.toggleClassName).removeClass(s.toggleClassName),
            $(this).prop("checked") ? i.addClass(s.toggleClassName) : i.removeClass(s.toggleClassName)
        }),
        n.find(t)
    })
},
function(t, e, n) {
    function s(t) {
        var e = {},
        s = /^jQuery\d+$/;
        return n.each(t.attributes,
        function(t, n) {
            n.specified && !s.test(n.name) && (e[n.name] = n.value)
        }),
        e
    }
    function i(t, s) {
        var i = this,
        r = n(i);
        if (i.value == r.attr("placeholder") && r.hasClass("placeholder")) if (r.data("placeholder-password")) {
            if (r = r.hide().next().show().attr("id", r.removeAttr("id").data("placeholder-id")), t === !0) return r[0].value = s;
            r.focus()
        } else i.value = "",
        r.removeClass("placeholder"),
        i == e.activeElement && i.select()
    }
    function r() {
        var t, e = this,
        r = n(e),
        a = this.id;
        if ("" == e.value) {
            if ("password" == e.type) {
                if (!r.data("placeholder-textinput")) {
                    try {
                        t = r.clone().attr({
                            type: "text"
                        })
                    } catch(o) {
                        t = n("<input>").attr(n.extend(s(this), {
                            type: "text"
                        }))
                    }
                    t.removeAttr("name").data({
                        "placeholder-password": !0,
                        "placeholder-id": a
                    }).bind("focus.placeholder", i),
                    r.data({
                        "placeholder-textinput": t,
                        "placeholder-id": a
                    }).before(t)
                }
                r = r.removeAttr("id").hide().prev().attr("id", a).show()
            }
            r.addClass("placeholder"),
            r[0].value = r.attr("placeholder")
        } else r.removeClass("placeholder")
    }
    var a, o, c = "placeholder" in e.createElement("input"),
    l = "placeholder" in e.createElement("textarea"),
    u = n.fn,
    d = n.valHooks;
    c && l ? (o = u.placeholder = function() {
        return this
    },
    o.input = o.textarea = !0) : (o = u.placeholder = function() {
        var t = this;
        return t.filter((c ? "textarea": ":input") + "[placeholder]").not(".placeholder").bind({
            "focus.placeholder": i,
            "blur.placeholder": r
        }).data("placeholder-enabled", !0).trigger("blur.placeholder"),
        t
    },
    o.input = c, o.textarea = l, a = {
        get: function(t) {
            var e = n(t);
            return e.data("placeholder-enabled") && e.hasClass("placeholder") ? "": t.value
        },
        set: function(t, s) {
            var a = n(t);
            return a.data("placeholder-enabled") ? ("" == s ? (t.value = s, t != e.activeElement && r.call(t)) : a.hasClass("placeholder") ? i.call(t, !0, s) || (t.value = s) : t.value = s, a) : t.value = s
        }
    },
    c || (d.input = a), l || (d.textarea = a), n(function() {
        n(e).delegate("form", "submit.placeholder",
        function() {
            var t = n(".placeholder", this).each(i);
            setTimeout(function() {
                t.each(r)
            },
            10)
        })
    }), n(t).bind("beforeunload.placeholder",
    function() {
        n(".placeholder").each(function() {
            this.value = ""
        })
    }))
} (this, document, jQuery),
function(t) {
    function e(t, e) {
        var n = t.find("a");
        if (n.length > 1) {
            var s = n.filter(".selected"),
            i = n.get().indexOf(s.get(0));
            return i += e,
            i >= n.length ? i = 0 : 0 > i && (i = n.length - 1),
            s.removeClass("selected"),
            n.eq(i).addClass("selected"),
            !0
        }
    }
    t.fn.quicksearch = function(n) {
        var s = t.extend({
            url: null,
            delay: 150,
            spinner: null,
            insertSpinner: null,
            loading: t(".quicksearch-loading")
        },
        n);
        s.insertSpinner && !s.spinner && (s.spinner = t('<img src="' + GitHub.Ajax.spinner + '" alt="" class="spinner" width="16" />'));
        var i = function(t) {
            return s.results.html(t).show()
        };
        return s.results.delegate("a", "mouseover",
        function() {
            var e = t(this);
            e.hasClass("selected") || (s.results.find("a.selected").removeClass("selected"), e.addClass("selected"))
        }),
        this.each(function() {
            function n() {
                s.insertSpinner && (s.spinner.parent().length || s.insertSpinner.call(a, s.spinner), s.spinner.show()),
                a.trigger("quicksearch.loading"),
                s.loading && i(s.loading.html())
            }
            function r() {
                s.insertSpinner && s.spinner.hide(),
                a.trigger("quicksearch.loaded")
            }
            var a = t(this);
            a.autocompleteField({
                url: s.url || a.attr("data-url"),
                dataType: s.dataType,
                delay: s.delay,
                useCache: !0,
                minLength: 2
            }).bind("keyup",
            function(t) {
                13 != t.which && a.val().length >= 2 && s.results.is(":empty") && n()
            }).bind("autocomplete:beforesend",
            function() {
                n()
            }).bind("autocomplete:finish",
            function(t, e) {
                i(e || {}),
                r()
            }).bind("autocomplete:clear",
            function() {
                s.results.html("").hide(),
                r()
            }).bind("focus",
            function() {
                a.val() && a.trigger("keyup")
            }).bind("blur",
            function() {
                setTimeout(function() {
                    a.trigger("autocomplete:clear")
                },
                250)
            }).bind("keydown",
            function(n) {
                switch (n.hotkey) {
                case "up":
                    if (e(s.results, -1)) return ! 1;
                    break;
                case "down":
                    if (e(s.results, 1)) return ! 1;
                    break;
                case "esc":
                    return t(this).blur(),
                    !1;
                case "enter":
                    var i = s.results.find("a.selected");
                    if (i.length) return t(this).blur(),
                    i.hasClass("initial") ? i.closest("form").submit() : window.location = i.attr("href"),
                    !1;
                    t(this).trigger("autocomplete:clear")
                }
            })
        })
    }
} (jQuery),
function(t) {
    t.smartPoller = function(e, n) {
        t.isFunction(e) && (n = e, e = 1e3),
        function s() {
            setTimeout(function() {
                n.call(this, s)
            },
            e),
            e = 1.5 * e
        } ()
    }
} (jQuery),
function(t) {
    function e(t) {
        return "tagName" in t ? t: t.parentNode
    }
    try {
        window.document.createEvent("TouchEvent")
    } catch(n) {
        return ! 1
    }
    var s, i = {};
    t(document).ready(function() {
        t(document.body).bind("touchstart",
        function(t) {
            var n = Date.now(),
            r = n - (i.last || n);
            i.target = e(t.originalEvent.touches[0].target),
            s && clearTimeout(s),
            i.x1 = t.originalEvent.touches[0].pageX,
            r > 0 && 250 >= r && (i.isDoubleTap = !0),
            i.last = n
        }).bind("touchmove",
        function(t) {
            i.x2 = t.originalEvent.touches[0].pageX
        }).bind("touchend",
        function() {
            i.isDoubleTap ? (t(i.target).trigger("doubleTap"), i = {}) : i.x2 > 0 ? (Math.abs(i.x1 - i.x2) > 30 && t(i.target).trigger("swipe") && t(i.target).trigger("swipe" + (i.x1 - i.x2 > 0 ? "Left": "Right")), i.x1 = i.x2 = i.last = 0) : "last" in i && (s = setTimeout(function() {
                s = null,
                t(i.target).trigger("tap"),
                i = {}
            },
            250))
        }).bind("touchcancel",
        function() {
            i = {}
        })
    }),
    ["swipe", "swipeLeft", "swipeRight", "doubleTap", "tap"].forEach(function(e) {
        t.fn[e] = function(t) {
            return this.bind(e, t)
        }
    })
} (jQuery),
function() {
    var t;
    t = function(t) {
        return debug("AJAX Error", t),
        $("#ajax-error-message").show(function() {
            return $(this).addClass("visible")
        })
    },
    $(document).on("ajaxError", "[data-remote]",
    function(e, n, s, i) {
        return "canceled" !== i ? /<html/.test(n.responseText) ? (t(i), e.stopImmediatePropagation()) : setTimeout(function() {
            return e.isDefaultPrevented() ? void 0 : t(i)
        },
        0) : void 0
    }),
    $(document).on("ajaxBeforeSend", "[data-remote]",
    function() {
        return $("#ajax-error-message").hide().removeClass("visible")
    }),
    $(document).on("click", ".js-ajax-error-dismiss",
    function() {
        return $("#ajax-error-message").hide().removeClass("visible"),
        !1
    })
}.call(this),
function() {
    $(document).on("ajaxSend", "[data-remote]",
    function(t) {
        return t.isDefaultPrevented() ? void 0 : ($(this).addClass("loading"), $(document.documentElement).addClass("ajax-loading"))
    }),
    $(document).on("ajaxComplete", "[data-remote]",
    function() {
        return $(document.documentElement).removeClass("ajax-loading"),
        $(this).removeClass("loading")
    })
}.call(this),
function() {
    var t;
    t = function(t) {
        var e, n, s, i, r;
        t = $(t),
        s = t.val(),
        $.trim(s) && (n = {
            type: "POST",
            url: t.attr("data-autocheck-url"),
            data: {
                value: s
            }
        },
        e = $.Event("autocheck:send"), t.trigger(e, n), e.isDefaultPrevented() || (t.addClass("is-autocheck-loading"), t.closest("dl.form").addClass("is-loading"), t.closest("dl.form").removeClass("errored successed"), t.removeClass("is-autocheck-successful is-autocheck-errored"), null != (r = t.data("autocheck-xhr")) && r.abort(), i = $.ajax(n).done(function() {
            return t.addClass("is-autocheck-successful"),
            t.closest("dl.form").unErrorify().addClass("successed"),
            t.trigger("autocheck:success", arguments)
        }).fail(function(e, n) {
            return "abort" !== n && t.is($.visible) ? (t.addClass("is-autocheck-errored"), /<html/.test(e.responseText) ? t.closest("dl.form").errorify("Something went wrong.") : t.closest("dl.form").errorify(e.responseText), t.trigger("autocheck:error", arguments)) : void 0
        }).always(function(e, n) {
            return "abort" !== n ? (t.removeClass("is-autocheck-loading"), t.closest("dl.form").removeClass("is-loading"), t.trigger("autocheck:complete", arguments)) : void 0
        }), t.data("autocheck-xhr", i)))
    },
    $(document).on("change", "input[data-autocheck-url]",
    function() {
        return t(this)
    }),
    $(document).onFocusedInput("input[data-autocheck-url]",
    function(e) {
        return $(this).on("throttled:input." + e,
        function() {
            return t(this)
        }),
        !1
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t() {
            this.onNavigationOpen = e(this.onNavigationOpen, this),
            this.onNavigationKeyDown = e(this.onNavigationKeyDown, this),
            this.onResultsChange = e(this.onResultsChange, this),
            this.onInputChange = e(this.onInputChange, this),
            this.onResultsMouseDown = e(this.onResultsMouseDown, this),
            this.onInputBlur = e(this.onInputBlur, this),
            this.onInputFocus = e(this.onInputFocus, this),
            $(document).on("focusin", "input[data-autocomplete]", this.onInputFocus),
            this.focusedInput = this.focusedResults = null,
            this.mouseDown = !1
        }
        return t.prototype.bindEvents = function(t, e) {
            return $(t).on("blur", this.onInputBlur),
            $(t).on("throttled:input", this.onInputChange),
            $(e).on("mousedown", this.onResultsMouseDown),
            $(e).on("autocomplete:change", this.onResultsChange),
            $(e).on("navigation:open", "[data-autocomplete-value]", this.onNavigationOpen),
            $(e).on("navigation:keydown", "[data-autocomplete-value]", this.onNavigationKeyDown)
        },
        t.prototype.unbindEvents = function(t, e) {
            return $(t).off("blur", this.onInputBlur),
            $(t).off("throttled:input", this.onInputChange),
            $(e).off("mousedown", this.onResultsMouseDown),
            $(e).off("autocomplete:change", this.onResultsChange),
            $(e).off("navigation:open", "[data-autocomplete-value]", this.onNavigationOpen),
            $(e).off("navigation:keydown", "[data-autocomplete-value]", this.onNavigationKeyDown)
        },
        t.prototype.onInputFocus = function(t) {
            var e, n;
            e = t.currentTarget,
            n = document.getElementById($(e).attr("data-autocomplete")),
            this.focusedInput = e,
            this.focusedResults = n,
            this.bindEvents(e, n),
            $(e).trigger("autocomplete:focus"),
            $(e).trigger("autocomplete:search", [$(e).val()])
        },
        t.prototype.onInputBlur = function(t) {
            var e, n;
            e = t.currentTarget,
            n = this.focusedResults,
            this.mouseDown || (this.hideResults(), this.inputValue = null, this.focusedInput = this.focusedResults = null, this.unbindEvents(e, n), $(e).trigger("autocomplete:blur"))
        },
        t.prototype.onResultsMouseDown = function() {
            var t;
            this.mouseDown = !0,
            t = function(e) {
                return function() {
                    return e.mouseDown = !1,
                    $(document).off("mouseup", t)
                }
            } (this),
            $(document).on("mouseup", t)
        },
        t.prototype.onInputChange = function(t, e) {
            var n;
            n = t.currentTarget,
            this.inputValue !== e && ($(n).removeAttr("data-autocompleted"), $(n).trigger("autocomplete:autocompleted:changed")),
            $(n).trigger("autocomplete:change", [e]),
            $(n).trigger("autocomplete:search", [e])
        },
        t.prototype.onResultsChange = function() {
            var t, e;
            e = $(this.focusedInput).val(),
            t = $(this.focusedResults).find("[data-autocomplete-value]"),
            0 === t.length ? this.hideResults() : this.inputValue !== e && (this.inputValue = e, this.showResults(), $(this.focusedInput).is("[data-autocomplete-autofocus]") && $(this.focusedResults).find("ul").navigation("focus"))
        },
        t.prototype.onNavigationKeyDown = function(t) {
            switch (t.hotkey) {
            case "tab":
                return this.onNavigationOpen(t),
                !1;
            case "esc":
                return this.hideResults(),
                !1
            }
        },
        t.prototype.onNavigationOpen = function(t) {
            var e, n;
            e = t.currentTarget,
            n = $(e).attr("data-autocomplete-value"),
            this.inputValue = n,
            $(this.focusedInput).val(n),
            $(this.focusedInput).attr("data-autocompleted", n),
            $(this.focusedInput).trigger("autocomplete:autocompleted:changed", [n]),
            $(this.focusedInput).trigger("autocomplete:result", [n]),
            $(e).removeClass("active"),
            this.hideResults()
        },
        t.prototype.showResults = function(t, e) {
            var n, s, i, r, a;
            return null == t && (t = this.focusedInput),
            null == e && (e = this.focusedResults),
            $(e).is($.visible) ? void 0 : (a = $(t).offset(), i = a.top, s = a.left, n = i + $(t).innerHeight(), r = $(t).innerWidth(), $(e).css({
                display: "block",
                position: "absolute",
                width: r + 2
            }), $(e).offset({
                top: n + 5,
                left: s + 1
            }), $(t).addClass("js-navigation-enable"), $(e).find("ul").navigation("push"), $(e).show())
        },
        t.prototype.hideResults = function(t, e) {
            return null == t && (t = this.focusedInput),
            null == e && (e = this.focusedResults),
            $(e).is($.visible) ? ($(t).removeClass("js-navigation-enable"), $(e).find("ul").navigation("pop"), $(e).hide()) : void 0
        },
        t
    } (),
    new t
}.call(this),
function() {
    $(document).focused(".js-autosearch-field")["in"](function() {
        var t, e, n;
        return t = $(this),
        e = t.closest("form"),
        n = $("#" + e.attr("data-results-container")),
        e.on("throttled:input.autosearch_form",
        function() {
            var t, s;
            return e.addClass("is-sending"),
            t = e.prop("action"),
            s = $.ajax({
                url: t,
                data: e.serializeArray(),
                context: this
            }),
            s.always(function() {
                return e.removeClass("is-sending")
            }),
            s.done(function(t) {
                return n.html(t)
            })
        })
    }).out(function() {
        return $(this).off(".autosearch_form")
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t(t) {
            this.container = t,
            this.hoverEnd = e(this.hoverEnd, this),
            this.hoverStart = e(this.hoverStart, this),
            this.items = this.container.find(".avatars li"),
            this.items.length > 1 && this.container.hover(this.hoverStart, this.hoverEnd)
        }
        return t.prototype.namespace = "avatarStack",
        t.prototype.hoverStart = function() {
            return this.container.addClass("avatar-stack-focus")
        },
        t.prototype.hoverEnd = function() {
            return this.container.removeClass("avatar-stack-focus")
        },
        t
    } (),
    $(function() {
        return $(".avatar-stack").each(function() {
            return new t($(this))
        })
    })
}.call(this),
function() {
    $(document).on("submit", ".js-braintree-encrypt",
    function() {
        var t;
        t = Braintree.create($(this).attr("data-braintree-key")),
        t.encryptForm(this)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v, $, y = [].slice,
    b = [].indexOf ||
    function(t) {
        for (var e = 0,
        n = this.length; n > e; e++) if (e in this && this[e] === t) return e;
        return - 1
    };
    t = jQuery,
    t.payment = {},
    t.payment.fn = {},
    t.fn.payment = function() {
        var e, n;
        return n = arguments[0],
        e = 2 <= arguments.length ? y.call(arguments, 1) : [],
        t.payment.fn[n].apply(this, e)
    },
    i = /(\d{1,4})/g,
    s = [{
        type: "maestro",
        pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
        format: i,
        length: [12, 13, 14, 15, 16, 17, 18, 19],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "dinersclub",
        pattern: /^(36|38|30[0-5])/,
        format: i,
        length: [14],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "laser",
        pattern: /^(6706|6771|6709)/,
        format: i,
        length: [16, 17, 18, 19],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "jcb",
        pattern: /^35/,
        format: i,
        length: [16],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "unionpay",
        pattern: /^62/,
        format: i,
        length: [16, 17, 18, 19],
        cvcLength: [3],
        luhn: !1
    },
    {
        type: "discover",
        pattern: /^(6011|65|64[4-9]|622)/,
        format: i,
        length: [16],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "mastercard",
        pattern: /^5[1-5]/,
        format: i,
        length: [16],
        cvcLength: [3],
        luhn: !0
    },
    {
        type: "amex",
        pattern: /^3[47]/,
        format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
        length: [15],
        cvcLength: [3, 4],
        luhn: !0
    },
    {
        type: "visa",
        pattern: /^4/,
        format: i,
        length: [13, 14, 15, 16],
        cvcLength: [3],
        luhn: !0
    }],
    e = function(t) {
        var e, n, i;
        for (t = (t + "").replace(/\D/g, ""), n = 0, i = s.length; i > n; n++) if (e = s[n], e.pattern.test(t)) return e
    },
    n = function(t) {
        var e, n, i;
        for (n = 0, i = s.length; i > n; n++) if (e = s[n], e.type === t) return e
    },
    h = function(t) {
        var e, n, s, i, r, a;
        for (s = !0, i = 0, n = (t + "").split("").reverse(), r = 0, a = n.length; a > r; r++) e = n[r],
        e = parseInt(e, 10),
        (s = !s) && (e *= 2),
        e > 9 && (e -= 9),
        i += e;
        return 0 === i % 10
    },
    d = function(t) {
        var e;
        return null != t.prop("selectionStart") && t.prop("selectionStart") !== t.prop("selectionEnd") ? !0 : ("undefined" != typeof document && null !== document ? null != (e = document.selection) ? "function" == typeof e.createRange ? e.createRange().text: void 0 : void 0 : void 0) ? !0 : !1
    },
    f = function(e) {
        return setTimeout(function() {
            var n, s;
            return n = t(e.currentTarget),
            s = n.val(),
            s = t.payment.formatCardNumber(s),
            n.val(s)
        })
    },
    o = function(n) {
        var s, i, r, a, o, c, l;
        return r = String.fromCharCode(n.which),
        !/^\d+$/.test(r) || (s = t(n.currentTarget), l = s.val(), i = e(l + r), a = (l.replace(/\D/g, "") + r).length, c = 16, i && (c = i.length[i.length.length - 1]), a >= c || null != s.prop("selectionStart") && s.prop("selectionStart") !== l.length) ? void 0 : (o = i && "amex" === i.type ? /^(\d{4}|\d{4}\s\d{6})$/: /(?:^|\s)(\d{4})$/, o.test(l) ? (n.preventDefault(), s.val(l + " " + r)) : o.test(l + r) ? (n.preventDefault(), s.val(l + r + " ")) : void 0)
    },
    r = function(e) {
        var n, s;
        return n = t(e.currentTarget),
        s = n.val(),
        e.meta || 8 !== e.which || null != n.prop("selectionStart") && n.prop("selectionStart") !== s.length ? void 0 : /\d\s$/.test(s) ? (e.preventDefault(), n.val(s.replace(/\d\s$/, ""))) : /\s\d?$/.test(s) ? (e.preventDefault(), n.val(s.replace(/\s\d?$/, ""))) : void 0
    },
    c = function(e) {
        var n, s, i;
        return s = String.fromCharCode(e.which),
        /^\d+$/.test(s) ? (n = t(e.currentTarget), i = n.val() + s, /^\d$/.test(i) && "0" !== i && "1" !== i ? (e.preventDefault(), n.val("0" + i + " / ")) : /^\d\d$/.test(i) ? (e.preventDefault(), n.val("" + i + " / ")) : void 0) : void 0
    },
    l = function(e) {
        var n, s, i;
        return s = String.fromCharCode(e.which),
        /^\d+$/.test(s) ? (n = t(e.currentTarget), i = n.val(), /^\d\d$/.test(i) ? n.val("" + i + " / ") : void 0) : void 0
    },
    u = function(e) {
        var n, s, i;
        return s = String.fromCharCode(e.which),
        "/" === s ? (n = t(e.currentTarget), i = n.val(), /^\d$/.test(i) && "0" !== i ? n.val("0" + i + " / ") : void 0) : void 0
    },
    a = function(e) {
        var n, s;
        if (!e.meta && (n = t(e.currentTarget), s = n.val(), 8 === e.which && (null == n.prop("selectionStart") || n.prop("selectionStart") === s.length))) return /\d(\s|\/)+$/.test(s) ? (e.preventDefault(), n.val(s.replace(/\d(\s|\/)*$/, ""))) : /\s\/\s?\d?$/.test(s) ? (e.preventDefault(), n.val(s.replace(/\s\/\s?\d?$/, ""))) : void 0
    },
    v = function(t) {
        var e;
        return t.metaKey || t.ctrlKey ? !0 : 32 === t.which ? !1 : 0 === t.which ? !0 : t.which < 33 ? !0 : (e = String.fromCharCode(t.which), !!/[\d\s]/.test(e))
    },
    p = function(n) {
        var s, i, r, a;
        return s = t(n.currentTarget),
        r = String.fromCharCode(n.which),
        /^\d+$/.test(r) && !d(s) ? (a = (s.val() + r).replace(/\D/g, ""), i = e(a), i ? a.length <= i.length[i.length.length - 1] : a.length <= 16) : void 0
    },
    g = function(e) {
        var n, s, i;
        return n = t(e.currentTarget),
        s = String.fromCharCode(e.which),
        /^\d+$/.test(s) && !d(n) ? (i = n.val() + s, i = i.replace(/\D/g, ""), i.length > 6 ? !1 : void 0) : void 0
    },
    m = function(e) {
        var n, s, i;
        return n = t(e.currentTarget),
        s = String.fromCharCode(e.which),
        /^\d+$/.test(s) ? (i = n.val() + s, i.length <= 4) : void 0
    },
    $ = function(e) {
        var n, i, r, a, o;
        return n = t(e.currentTarget),
        o = n.val(),
        a = t.payment.cardType(o) || "unknown",
        n.hasClass(a) ? void 0 : (i = function() {
            var t, e, n;
            for (n = [], t = 0, e = s.length; e > t; t++) r = s[t],
            n.push(r.type);
            return n
        } (), n.removeClass("unknown"), n.removeClass(i.join(" ")), n.addClass(a), n.toggleClass("identified", "unknown" !== a), n.trigger("payment.cardType", a))
    },
    t.payment.fn.formatCardCVC = function() {
        return this.payment("restrictNumeric"),
        this.on("keypress", m),
        this
    },
    t.payment.fn.formatCardExpiry = function() {
        return this.payment("restrictNumeric"),
        this.on("keypress", g),
        this.on("keypress", c),
        this.on("keypress", u),
        this.on("keypress", l),
        this.on("keydown", a),
        this
    },
    t.payment.fn.formatCardNumber = function() {
        return this.payment("restrictNumeric"),
        this.on("keypress", p),
        this.on("keypress", o),
        this.on("keydown", r),
        this.on("keyup", $),
        this.on("paste", f),
        this
    },
    t.payment.fn.restrictNumeric = function() {
        return this.on("keypress", v),
        this
    },
    t.payment.fn.cardExpiryVal = function() {
        return t.payment.cardExpiryVal(t(this).val())
    },
    t.payment.cardExpiryVal = function(t) {
        var e, n, s, i;
        return t = t.replace(/\s/g, ""),
        i = t.split("/", 2),
        e = i[0],
        s = i[1],
        2 === (null != s ? s.length: void 0) && /^\d+$/.test(s) && (n = (new Date).getFullYear(), n = n.toString().slice(0, 2), s = n + s),
        e = parseInt(e, 10),
        s = parseInt(s, 10),
        {
            month: e,
            year: s
        }
    },
    t.payment.validateCardNumber = function(t) {
        var n, s;
        return t = (t + "").replace(/\s+|-/g, ""),
        /^\d+$/.test(t) ? (n = e(t), n ? (s = t.length, b.call(n.length, s) >= 0 && (n.luhn === !1 || h(t))) : !1) : !1
    },
    t.payment.validateCardExpiry = function(e, n) {
        var s, i, r, a;
        return "object" == typeof e && "month" in e && (a = e, e = a.month, n = a.year),
        e && n ? (e = t.trim(e), n = t.trim(n), /^\d+$/.test(e) ? /^\d+$/.test(n) ? parseInt(e, 10) <= 12 ? (2 === n.length && (r = (new Date).getFullYear(), r = r.toString().slice(0, 2), n = r + n), i = new Date(n, e), s = new Date, i.setMonth(i.getMonth() - 1), i.setMonth(i.getMonth() + 1, 1), i > s) : !1 : !1 : !1) : !1
    },
    t.payment.validateCardCVC = function(e, s) {
        var i, r;
        return e = t.trim(e),
        /^\d+$/.test(e) ? s ? (i = e.length, b.call(null != (r = n(s)) ? r.cvcLength: void 0, i) >= 0) : e.length >= 3 && e.length <= 4 : !1
    },
    t.payment.cardType = function(t) {
        var n;
        return t ? (null != (n = e(t)) ? n.type: void 0) || null: null
    },
    t.payment.formatCardNumber = function(t) {
        var n, s, i, r;
        return (n = e(t)) ? (i = n.length[n.length.length - 1], t = t.replace(/\D/g, ""), t = t.slice(0, +i + 1 || 9e9), n.format.global ? null != (r = t.match(n.format)) ? r.join(" ") : void 0 : (s = n.format.exec(t), null != s && s.shift(), null != s ? s.join(" ") : void 0)) : t
    }
}.call(this),
function() {
    var t = [].indexOf ||
    function(t) {
        for (var e = 0,
        n = this.length; n > e; e++) if (e in this && this[e] === t) return e;
        return - 1
    };
    $.observe(".js-card-select-number-field",
    function() {
        $(this).payment("formatCardNumber")
    }),
    $.observe(".js-card-cvv",
    function() {
        $(this).payment("formatCardCVC")
    }),
    $.observe(".js-card-select-number-field",
    function() {
        var t, e, n;
        e = $(this).closest("form"),
        t = e.find(".js-card"),
        n = e.find(".js-card-select-type-field"),
        $(this).on("input",
        function() {
            var e, s, i, r, a;
            if (i = $(this).val(), s = $.payment.cardType(i)) for (r = 0, a = t.length; a > r; r++) e = t[r],
            $(e).toggleClass("enabled", $(e).attr("data-name") === s),
            $(e).toggleClass("disabled", $(e).attr("data-name") !== s);
            else t.removeClass("enabled disabled");
            n.val(s)
        })
    }),
    $(document).on("blur", ".js-card-select-number-field",
    function() {
        return $(this).val($.payment.formatCardNumber($(this).val()))
    }),
    $(document).on("click", ".js-card",
    function() {
        var t, e;
        return t = $(this).closest("form"),
        e = t.find(".js-card-select-number-field"),
        e.focus()
    }),
    $(document).on("change", ".js-select-country",
    function() {
        var e, n, s, i, r, a;
        return n = $(this).find("option:selected").text(),
        i = {
            Austria: "ATU000000000",
            Belgium: "BE0000000000",
            Bulgaria: "BG000000000...",
            Croatia: "",
            Cyprus: "CY000000000X",
            "Czech Republic": "CZ00000000...",
            Denmark: "DK00 00 00 00",
            Estonia: "EE000000000",
            Finland: "FI00000000",
            France: "FRXX 000000000",
            Germany: "DE000000000",
            Greece: "EL000000000",
            Hungary: "HU00000000",
            Iceland: "",
            Ireland: "IE...",
            Italy: "IT00000000000",
            Latvia: "LV00000000000",
            Lithuania: "LT000000000...",
            Luxembourg: "LU00000000",
            Malta: "MT00000000",
            Netherlands: "NL000000000B00",
            Norway: "",
            Poland: "PL0000000000",
            Portugal: "PT000000000",
            Romania: "RO...",
            Slovakia: "SK0000000000",
            Slovenia: "",
            Spain: "ES...",
            Sweden: "SE000000000000",
            Switzerland: "",
            "United Kingdom": "GB..."
        },
        s = ["Angola", "Antigua and Barbuda", "Aruba", "Bahamas", "Belize", "Benin", "Botswana", "Cameroon", "Comoros", "Congo (Brazzaville)", "Congo (Kinshasa)", "Cook Islands", "CÃ´te d'Ivoire", "Djibouti", "Dominica", "Fiji", "French Southern Lands", "Ghana", "Guyana", "Hong Kong", "Ireland", "Kiribati", "Korea, North", "Malawi", "Maritania", "Mauritius", "Montserrat", "Nauru", "Niue", "Qatar", "Saint Kitts and Nevis", "Saint Lucia", "Sao Tome and Principe", "Seychelles", "Sierra Leone", "Sint Maarten (Dutch part)", "Solomon Islands", "Somalia", "Suriname", "Syria", "Togo", "Tokelau", "Tonga", "United Arab Emirates", "Vanuatu", "Yemen", "Zimbabwe"],
        r = i[n],
        $(".js-setup-creditcard").toggleClass("is-vat-country", null != r),
        a = null != r ? "(" + r + ")": "",
        e = $(this).parents(".js-setup-creditcard").find(".js-vat-help-text"),
        e.html(a),
        "United States of America" !== n ? ($(".js-setup-creditcard").addClass("is-international"), $(".js-select-state").removeAttr("required").val("")) : ($(".js-setup-creditcard").removeClass("is-international"), $(".js-select-state").attr("required", "required")),
        t.call(s, n) >= 0 ? ($(".js-postal-code-form").hide(), $(".js-postal-code-field").removeAttr("required").val("")) : ($(".js-postal-code-form").show(), $(".js-postal-code-field").attr("required", "required"))
    })
}.call(this),
function() {
    $(document).on("click:prepare", ".minibutton.disabled",
    function(t) {
        t.preventDefault(),
        t.stopPropagation()
    })
}.call(this),
function() {
    var t;
    null == window.GitHub && (window.GitHub = {}),
    window.GitHub.assetHostUrl = null != (t = $("link[rel=assets]").prop("href")) ? t: "/"
}.call(this),
function() {
    var t;
    ZeroClipboard.config({
        moviePath: "" + GitHub.assetHostUrl + "flash/ZeroClipboard.v1.3.2.swf",
        trustedOrigins: location.hostname,
        allowScriptAccess: "always"
    }),
    $.observe(".js-zeroclipboard", t = function(t) {
        var e;
        e = new ZeroClipboard(t),
        e.on("load",
        function() {
            return $(".tipsy-tooltips").length ? $("#global-zeroclipboard-html-bridge").tipsy() : $("#global-zeroclipboard-html-bridge").addClass("tooltipped tooltipped-s")
        }),
        e.on("mouseover",
        function() {
            var e, n;
            return n = $(t).attr("aria-label"),
            e = $("#global-zeroclipboard-html-bridge").attr("aria-label", n || "Copy to clipboard."),
            $(".tipsy-tooltips").length ? e.tipsy("show") : void 0
        }),
        e.on("complete",
        function() {
            var e, n;
            return n = $(t).attr("data-copied-hint"),
            e = $("#global-zeroclipboard-html-bridge").attr("aria-label", n || "Copied!"),
            $(".tipsy-tooltips").length ? e.tipsy("show") : void 0
        }),
        e.on("noflash wrongflash",
        function() {
            return $(t).remove()
        })
    })
}.call(this),
function() {
    $(document).on("ajaxBeforeSend", ".js-new-comment-form",
    function(t) {
        return this === t.target ? $(this).data("remote-xhr") ? !1 : void 0 : void 0
    }),
    $(document).on("ajaxSend", ".js-new-comment-form",
    function(t) {
        return this === t.target ? $(this).find(".js-comment-form-error").hide() : void 0
    }),
    $(document).on("ajaxSuccess", ".js-new-comment-form",
    function(t, e, n, s) {
        var i, r, a, o;
        if (this === t.target) {
            this.reset(),
            $(this).find(".js-comment-field").trigger("validation:field:change"),
            $(this).find(".js-write-tab").click(),
            o = s.updateContent;
            for (a in o) r = o[a],
            i = $(a),
            i[0] || console.warn("couldn't find " + a + " for immediate update"),
            i.updateContent(r)
        }
    }),
    $(document).on("ajaxError", ".js-new-comment-form",
    function(t, e) {
        var n, s;
        if (this === t.target) return s = "There was an error creating your comment",
        422 === e.status && (n = JSON.parse(e.responseText), n.errors && (s += ": " + n.errors.join(", "))),
        $(this).find(".js-comment-form-error").show().text(s),
        !1
    })
}.call(this),
function() {
    $(document).onFocusedInput(".js-new-comment-form .js-comment-field",
    function() {
        var t, e, n, s, i;
        return e = $(this).closest(".js-new-comment-form"),
        t = e.find(".js-comment-and-button").first(),
        t[0] ? (s = t.text(), i = t.attr("data-original-text"), n = t.attr("data-comment-text"),
        function() {
            var e, r;
            r = "" !== $(this).val().trim(),
            e = r ? n: i,
            e !== s && t.text(s = e)
        }) : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".js-comment-edit-button",
    function() {
        var t;
        return t = $(this).closest(".js-comment"),
        t.addClass("is-comment-editing"),
        t.find(".js-comment-field").focus().trigger("change"),
        !1
    }),
    $(document).on("click", ".js-new-discussion-timeline .js-comment-edit-title-button",
    function() {
        return $(this).closest(".js-new-discussion-timeline").find(".js-comment-edit-button").first().click()
    }),
    $(document).on("click", ".js-comment-cancel-button",
    function() {
        var t;
        return t = $(this).closest("form"),
        t.hasDirtyFields() && !confirm($(this).attr("data-confirm-text")) ? !1 : (t[0].reset(), $(this).closest(".js-comment").removeClass("is-comment-editing"), !1)
    }),
    $(document).on("ajaxSend", ".js-comment-delete, .js-comment-update, .js-issue-update",
    function(t, e) {
        var n;
        return n = $(this).closest(".js-comment"),
        n.addClass("is-comment-loading"),
        n.find(".minibutton").addClass("disabled"),
        e.setRequestHeader("X-Body-Version", n.attr("data-body-version"))
    }),
    $(document).on("ajaxError", ".js-comment-update",
    function(t, e, n, s) {
        var i, r, a, o;
        if (debug("ajaxError for js-comment-update", s), 422 === e.status) try {
            if (r = JSON.parse(e.responseText), i = $(this).closest(".js-comment"), r.stale) return e.stale = !0,
            i.addClass("is-comment-stale"),
            i.find(".minibutton").addClass("disabled"),
            i.hasClass("is-updating-task-list") && window.location.reload(),
            t.preventDefault();
            if (r.errors) return a = "There was an error posting your comment: " + r.errors.join(", "),
            i.find(".js-comment-update-error").text(a).show(),
            t.preventDefault()
        } catch(o) {
            return o = o,
            debug("Error trying to handle ajaxError for js-comment-update: " + o)
        }
    }),
    $(document).on("ajaxComplete", ".js-comment-delete, .js-comment-update",
    function(t, e) {
        var n;
        return n = $(this).closest(".js-comment"),
        n.removeClass("is-comment-loading"),
        n.find(".minibutton").removeClass("disabled"),
        e.stale ? n.find(".form-actions button[type=submit].minibutton").addClass("disabled") : void 0
    }),
    $(document).on("ajaxSuccess", ".js-comment-delete",
    function() {
        var t, e;
        return t = $(this).closest(".js-comment"),
        e = $(this).closest(".js-comment-container"),
        e.length || (e = t),
        e.fadeOut(function() {
            return t.removeClass("is-comment-editing")
        })
    }),
    $(document).on("ajaxSuccess", ".js-comment-update",
    function(t, e, n, s) {
        var i, r, a, o, c, l;
        for (i = $(this).closest(".js-comment"), r = $(this).closest(".js-comment-container"), r.length || (r = i), i.find(".js-comment-body").html(s.body), i.attr("data-body-version", s.newBodyVersion), $(".js-issue-update").attr("data-body-version", s.newBodyVersion), l = i.find("input, textarea"), o = 0, c = l.length; c > o; o++) a = l[o],
        a.defaultValue = a.value;
        return i.removeClass("is-comment-editing"),
        r.pageUpdate()
    }),
    $(document).on("ajaxSuccess", ".js-issue-update",
    function(t, e, n, s) {
        var i, r, a, o, c, l;
        for (i = $(this).parents(".js-details-container"), i.find(".js-details-target").last().click(), null != s.title && i.find(".js-issue-title").html(s.title), i.attr("data-body-version", s.newBodyVersion), a = document.title.replace(/(.*)Â· Issue #/, "" + s.title + " Â· Issue #"), a = a.replace(/(.*)Â· Pull Request #/, "" + s.title + " Â· Pull Request #"), document.title = a, l = i.find("input"), o = 0, c = l.length; c > o; o++) r = l[o],
        r.defaultValue = r.value;
        return i.pageUpdate()
    })
}.call(this),
function() {
    $(document).on("focusin", ".js-write-bucket",
    function() {
        return $(this).addClass("focused")
    }),
    $(document).on("focusout", ".js-write-bucket",
    function() {
        return $(this).removeClass("focused")
    })
}.call(this),
function() {
    $(document).onFocusedKeydown(".js-comment-field",
    function() {
        return function(t) {
            var e;
            return "ctrl+L" !== t.hotkey && "meta+L" !== t.hotkey || !(e = $(this).prev(".js-enable-fullscreen")[0]) ? void 0 : (e.click(), !1)
        }
    })
}.call(this),
function() {
    var t;
    $(document).on("click", ".add-line-comment[data-remote]",
    function() {
        var e, n;
        return $(this).hasClass("loading") ? !1 : ($(this).closest(".file").addClass("show-inline-notes"), n = $(this).closest("tr"), e = n.next("tr.inline-comments"), e.length ? t(e) : $.ajax({
            context: this,
            url: $(this).attr("data-remote"),
            success: function(e) {
                return n.after(e).pageUpdate(),
                t(n.next("tr.inline-comments"))
            }
        }))
    }),
    t = function(t) {
        return t.find(".js-write-tab").click(),
        t.addClass("show-inline-comment-form").find(".js-comment-field").focus()
    },
    $(document).on("click", ".js-show-inline-comment-form",
    function() {
        return t($(this).closest(".inline-comments")),
        !1
    }),
    $(document).on("click", ".js-hide-inline-comment-form",
    function() {
        var t;
        return t = $(this).closest(".inline-comments"),
        t.removeClass("show-inline-comment-form"),
        t.find(".inline-comment-form .js-comment-field").val(""),
        t.find(".js-comments-holder").children().visible().length || t.remove(),
        !1
    }),
    $(document).onFocusedKeydown(".inline-comment-form .js-comment-field",
    function() {
        return function(t) {
            var e;
            if (!$(this).hasClass("js-navigation-enable")) return "esc" === t.hotkey && 0 === this.value.length ? (e = $(this).closest(".inline-comments"), e.find(".js-hide-inline-comment-form").click(), !1) : void 0
        }
    }),
    $(document).on("ajaxSend", ".js-inline-comment-form",
    function() {
        return $(this).find(".ajaxindicator").show()
    }),
    $(document).on("ajaxComplete", ".js-inline-comment-form",
    function() {
        return $(this).find(".ajaxindicator").hide()
    }),
    $(document).on("ajaxSuccess", ".js-inline-comment-form",
    function(t, e, n, s) {
        var i, r;
        return r = $(this).closest(".js-line-comments"),
        r.find(".js-comments-holder").append(s),
        r.find(".js-hide-inline-comment-form").click(),
        i = r.closest(".inline-comments").find(".comment-count .counter"),
        i.text(parseInt(i.text().replace(",", "")) + 1),
        r.closest(".inline-comments").pageUpdate()
    }),
    $(document).on("ajaxSuccess", ".inline-comments .js-comment-delete",
    function() {
        var t, e;
        return t = $(this).closest(".inline-comments"),
        e = $(this).closest(".timeline-comment"),
        e.remove(),
        setTimeout(function() {
            return function() {
                return t.find(".js-comments-holder").children().visible().length ? void 0 : t.remove()
            }
        } (this), 500)
    })
}.call(this),
function() {
    var t, e;
    $(document).on("click", ".js-write-tab",
    function() {
        var t;
        return t = $(this).closest(".js-previewable-comment-form"),
        t.addClass("write-selected").removeClass("preview-selected"),
        t.find(".tabnav-tab").removeClass("selected"),
        $(this).addClass("selected"),
        !1
    }),
    $(document).on("click", ".js-preview-tab",
    function() {
        var n;
        return n = $(this).closest(".js-previewable-comment-form"),
        n.addClass("preview-selected").removeClass("write-selected"),
        n.find(".tabnav-tab").removeClass("selected"),
        $(this).addClass("selected"),
        t(n),
        e(n),
        !1
    }),
    e = function(t) {
        var e;
        return e = t.find(".comment-body"),
        e.html("<p>Loading preview&hellip;</p>"),
        $.ajax({
            type: "POST",
            url: t.attr("data-preview-url"),
            data: {
                text: t.find(".js-comment-field").val()
            },
            success: function(t) {
                return e.html(t || "<p>Nothing to preview</p>")
            }
        })
    },
    $(document).onFocusedKeydown(".js-comment-field",
    function() {
        return function(t) {
            var e;
            return "ctrl+P" !== t.hotkey && "meta+P" !== t.hotkey || (e = $(this).closest(".js-previewable-comment-form"), !e.hasClass("write-selected")) ? void 0 : ($(this).blur(), e.find(".preview-tab").click(), t.stopImmediatePropagation(), !1)
        }
    }),
    t = function(t) {
        return $(document).off("keydown.unpreview"),
        $(document).on("keydown.unpreview",
        function(e) {
            return "ctrl+P" === e.hotkey || "meta+P" === e.hotkey ? (t.find(".js-write-tab").click(), t.find(".js-comment-field").focus(), $(document).off("keydown.unpreview"), !1) : void 0
        })
    }
}.call(this),
function() {
    $(document).onFocusedKeydown(".js-comment-field",
    function() {
        return function(t) {
            return "ctrl+enter" === t.hotkey || "meta+enter" === t.hotkey ? ($(this).closest("form").submit(), !1) : void 0
        }
    })
}.call(this),
function() {
    $(document).on("pjax:send", ".context-loader-container",
    function() {
        var t;
        return t = $(this).find(".context-loader").first(),
        t.length ? t.addClass("is-context-loading") : $(".page-context-loader").addClass("is-context-loading")
    }),
    $(document).on("pjax:complete", ".context-loader-container",
    function(t) {
        return $(t.target).find(".context-loader").first().removeClass("is-context-loading"),
        $(".page-context-loader").removeClass("is-context-loading"),
        $(document.body).removeClass("disables-context-loader")
    }),
    $(document).on("pjax:timeout", ".context-loader-container",
    function() {
        return ! 1
    })
}.call(this),
function() {}.call(this),
function(t) {
    t.Jcrop = function(e, n) {
        function s(t) {
            return Math.round(t) + "px"
        }
        function i(t) {
            return E.baseClass + "-" + t
        }
        function r() {
            return t.fx.step.hasOwnProperty("backgroundColor")
        }
        function a(e) {
            var n = t(e).offset();
            return [n.left, n.top]
        }
        function o(t) {
            return [t.pageX - L[0], t.pageY - L[1]]
        }
        function c(e) {
            "object" != typeof e && (e = {}),
            E = t.extend(E, e),
            t.each(["onChange", "onSelect", "onRelease", "onDblClick"],
            function(t, e) {
                "function" != typeof E[e] && (E[e] = function() {})
            })
        }
        function l(t, e, n) {
            if (L = a(U), me.setCursor("move" === t ? t: t + "-resize"), "move" === t) return me.activateHandlers(d(e), g, n);
            var s = de.getFixed(),
            i = h(t),
            r = de.getCorner(h(i));
            de.setPressed(de.getCorner(i)),
            de.setCurrent(r),
            me.activateHandlers(u(t, s), g, n)
        }
        function u(t, e) {
            return function(n) {
                if (E.aspectRatio) switch (t) {
                case "e":
                    n[1] = e.y + 1;
                    break;
                case "w":
                    n[1] = e.y + 1;
                    break;
                case "n":
                    n[0] = e.x + 1;
                    break;
                case "s":
                    n[0] = e.x + 1
                } else switch (t) {
                case "e":
                    n[1] = e.y2;
                    break;
                case "w":
                    n[1] = e.y2;
                    break;
                case "n":
                    n[0] = e.x2;
                    break;
                case "s":
                    n[0] = e.x2
                }
                de.setCurrent(n),
                fe.update()
            }
        }
        function d(t) {
            var e = t;
            return pe.watchKeys(),
            function(t) {
                de.moveOffset([t[0] - e[0], t[1] - e[1]]),
                e = t,
                fe.update()
            }
        }
        function h(t) {
            switch (t) {
            case "n":
                return "sw";
            case "s":
                return "nw";
            case "e":
                return "nw";
            case "w":
                return "ne";
            case "ne":
                return "sw";
            case "nw":
                return "se";
            case "se":
                return "nw";
            case "sw":
                return "ne"
            }
        }
        function f(t) {
            return function(e) {
                return E.disabled ? !1 : "move" !== t || E.allowMove ? (L = a(U), se = !0, l(t, o(e)), e.stopPropagation(), e.preventDefault(), !1) : !1
            }
        }
        function m(t, e, n) {
            var s = t.width(),
            i = t.height();
            s > e && e > 0 && (s = e, i = e / t.width() * t.height()),
            i > n && n > 0 && (i = n, s = n / t.height() * t.width()),
            ee = t.width() / s,
            ne = t.height() / i,
            t.width(s).height(i)
        }
        function p(t) {
            return {
                x: t.x * ee,
                y: t.y * ne,
                x2: t.x2 * ee,
                y2: t.y2 * ne,
                w: t.w * ee,
                h: t.h * ne
            }
        }
        function g() {
            var t = de.getFixed();
            t.w > E.minSelect[0] && t.h > E.minSelect[1] ? (fe.enableHandles(), fe.done()) : fe.release(),
            me.setCursor(E.allowSelect ? "crosshair": "default")
        }
        function v(t) {
            if (E.disabled) return ! 1;
            if (!E.allowSelect) return ! 1;
            se = !0,
            L = a(U),
            fe.disableHandles(),
            me.setCursor("crosshair");
            var e = o(t);
            return de.setPressed(e),
            fe.update(),
            me.activateHandlers($, g, "touch" === t.type.substring(0, 5)),
            pe.watchKeys(),
            t.stopPropagation(),
            t.preventDefault(),
            !1
        }
        function $(t) {
            de.setCurrent(t),
            fe.update()
        }
        function y() {
            var e = t("<div></div>").addClass(i("tracker"));
            return I && e.css({
                opacity: 0,
                backgroundColor: "white"
            }),
            e
        }
        function b(t) {
            W.removeClass().addClass(i("holder")).addClass(t)
        }
        function j(t, e) {
            function n() {
                window.setTimeout($, d)
            }
            var s = t[0] / ee,
            i = t[1] / ne,
            r = t[2] / ee,
            a = t[3] / ne;
            if (!ie) {
                var o = de.flipCoords(s, i, r, a),
                c = de.getFixed(),
                l = [c.x, c.y, c.x2, c.y2],
                u = l,
                d = E.animationDelay,
                h = o[0] - l[0],
                f = o[1] - l[1],
                m = o[2] - l[2],
                p = o[3] - l[3],
                g = 0,
                v = E.swingSpeed;
                s = u[0],
                i = u[1],
                r = u[2],
                a = u[3],
                fe.animMode(!0);
                var $ = function() {
                    return function() {
                        g += (100 - g) / v,
                        u[0] = Math.round(s + g / 100 * h),
                        u[1] = Math.round(i + g / 100 * f),
                        u[2] = Math.round(r + g / 100 * m),
                        u[3] = Math.round(a + g / 100 * p),
                        g >= 99.8 && (g = 100),
                        100 > g ? (x(u), n()) : (fe.done(), fe.animMode(!1), "function" == typeof e && e.call(ge))
                    }
                } ();
                n()
            }
        }
        function w(t) {
            x([t[0] / ee, t[1] / ne, t[2] / ee, t[3] / ne]),
            E.onSelect.call(ge, p(de.getFixed())),
            fe.enableHandles()
        }
        function x(t) {
            de.setPressed([t[0], t[1]]),
            de.setCurrent([t[2], t[3]]),
            fe.update()
        }
        function C() {
            return p(de.getFixed())
        }
        function k() {
            return de.getFixed()
        }
        function S(t) {
            c(t),
            B()
        }
        function _() {
            E.disabled = !0,
            fe.disableHandles(),
            fe.setCursor("default"),
            me.setCursor("default")
        }
        function T() {
            E.disabled = !1,
            B()
        }
        function D() {
            fe.done(),
            me.activateHandlers(null, null)
        }
        function M() {
            W.remove(),
            O.show(),
            O.css("visibility", "visible"),
            t(e).removeData("Jcrop")
        }
        function P(t, e) {
            fe.release(),
            _();
            var n = new Image;
            n.onload = function() {
                var s = n.width,
                i = n.height,
                r = E.boxWidth,
                a = E.boxHeight;
                U.width(s).height(i),
                U.attr("src", t),
                K.attr("src", t),
                m(U, r, a),
                N = U.width(),
                Y = U.height(),
                K.width(N).height(Y),
                oe.width(N + 2 * ae).height(Y + 2 * ae),
                W.width(N).height(Y),
                he.resize(N, Y),
                T(),
                "function" == typeof e && e.call(ge)
            },
            n.src = t
        }
        function A(t, e, n) {
            var s = e || E.bgColor;
            E.bgFade && r() && E.fadeTime && !n ? t.animate({
                backgroundColor: s
            },
            {
                queue: !1,
                duration: E.fadeTime
            }) : t.css("backgroundColor", s)
        }
        function B(t) {
            E.allowResize ? t ? fe.enableOnly() : fe.enableHandles() : fe.disableHandles(),
            me.setCursor(E.allowSelect ? "crosshair": "default"),
            fe.setCursor(E.allowMove ? "move": "default"),
            E.hasOwnProperty("trueSize") && (ee = E.trueSize[0] / N, ne = E.trueSize[1] / Y),
            E.hasOwnProperty("setSelect") && (w(E.setSelect), fe.done(), delete E.setSelect),
            he.refresh(),
            E.bgColor != ce && (A(E.shade ? he.getShades() : W, E.shade ? E.shadeColor || E.bgColor: E.bgColor), ce = E.bgColor),
            le != E.bgOpacity && (le = E.bgOpacity, E.shade ? he.refresh() : fe.setBgOpacity(le)),
            J = E.maxSize[0] || 0,
            Q = E.maxSize[1] || 0,
            Z = E.minSize[0] || 0,
            te = E.minSize[1] || 0,
            E.hasOwnProperty("outerImage") && (U.attr("src", E.outerImage), delete E.outerImage),
            fe.refresh()
        }
        var L, E = t.extend({},
        t.Jcrop.defaults),
        F = navigator.userAgent.toLowerCase(),
        I = /msie/.test(F),
        z = /msie [1-6]\./.test(F);
        "object" != typeof e && (e = t(e)[0]),
        "object" != typeof n && (n = {}),
        c(n);
        var q = {
            border: "none",
            visibility: "visible",
            margin: 0,
            padding: 0,
            position: "absolute",
            top: 0,
            left: 0
        },
        O = t(e),
        R = !0;
        if ("IMG" == e.tagName) {
            if (0 != O[0].width && 0 != O[0].height) O.width(O[0].width),
            O.height(O[0].height);
            else {
                var H = new Image;
                H.src = O[0].src,
                O.width(H.width),
                O.height(H.height)
            }
            var U = O.clone().removeAttr("id").css(q).show();
            U.width(O.width()),
            U.height(O.height()),
            O.after(U).hide()
        } else U = O.css(q).show(),
        R = !1,
        null === E.shade && (E.shade = !0);
        m(U, E.boxWidth, E.boxHeight);
        var N = U.width(),
        Y = U.height(),
        W = t("<div />").width(N).height(Y).addClass(i("holder")).css({
            position: "relative",
            backgroundColor: E.bgColor
        }).insertAfter(O).append(U);
        E.addClass && W.addClass(E.addClass);
        var K = t("<div />"),
        G = t("<div />").width("100%").height("100%").css({
            zIndex: 310,
            position: "absolute",
            overflow: "hidden"
        }),
        X = t("<div />").width("100%").height("100%").css("zIndex", 320),
        V = t("<div />").css({
            position: "absolute",
            zIndex: 600
        }).dblclick(function() {
            var t = de.getFixed();
            E.onDblClick.call(ge, t)
        }).insertBefore(U).append(G, X);
        R && (K = t("<img />").attr("src", U.attr("src")).css(q).width(N).height(Y), G.append(K)),
        z && V.css({
            overflowY: "hidden"
        });
        var J, Q, Z, te, ee, ne, se, ie, re, ae = E.boundary,
        oe = y().width(N + 2 * ae).height(Y + 2 * ae).css({
            position: "absolute",
            top: s( - ae),
            left: s( - ae),
            zIndex: 290
        }).mousedown(v),
        ce = E.bgColor,
        le = E.bgOpacity;
        L = a(U);
        var ue = function() {
            function t() {
                var t, e = {},
                n = ["touchstart", "touchmove", "touchend"],
                s = document.createElement("div");
                try {
                    for (t = 0; t < n.length; t++) {
                        var i = n[t];
                        i = "on" + i;
                        var r = i in s;
                        r || (s.setAttribute(i, "return;"), r = "function" == typeof s[i]),
                        e[n[t]] = r
                    }
                    return e.touchstart && e.touchend && e.touchmove
                } catch(a) {
                    return ! 1
                }
            }
            function e() {
                return E.touchSupport === !0 || E.touchSupport === !1 ? E.touchSupport: t()
            }
            return {
                createDragger: function(t) {
                    return function(e) {
                        return E.disabled ? !1 : "move" !== t || E.allowMove ? (L = a(U), se = !0, l(t, o(ue.cfilter(e)), !0), e.stopPropagation(), e.preventDefault(), !1) : !1
                    }
                },
                newSelection: function(t) {
                    return v(ue.cfilter(t))
                },
                cfilter: function(t) {
                    return t.pageX = t.originalEvent.changedTouches[0].pageX,
                    t.pageY = t.originalEvent.changedTouches[0].pageY,
                    t
                },
                isSupported: t,
                support: e()
            }
        } (),
        de = function() {
            function t(t) {
                t = a(t),
                m = h = t[0],
                p = f = t[1]
            }
            function e(t) {
                t = a(t),
                u = t[0] - m,
                d = t[1] - p,
                m = t[0],
                p = t[1]
            }
            function n() {
                return [u, d]
            }
            function s(t) {
                var e = t[0],
                n = t[1];
                0 > h + e && (e -= e + h),
                0 > f + n && (n -= n + f),
                p + n > Y && (n += Y - (p + n)),
                m + e > N && (e += N - (m + e)),
                h += e,
                m += e,
                f += n,
                p += n
            }
            function i(t) {
                var e = r();
                switch (t) {
                case "ne":
                    return [e.x2, e.y];
                case "nw":
                    return [e.x, e.y];
                case "se":
                    return [e.x2, e.y2];
                case "sw":
                    return [e.x, e.y2]
                }
            }
            function r() {
                if (!E.aspectRatio) return c();
                var t, e, n, s, i = E.aspectRatio,
                r = E.minSize[0] / ee,
                a = E.maxSize[0] / ee,
                u = E.maxSize[1] / ne,
                d = m - h,
                g = p - f,
                v = Math.abs(d),
                $ = Math.abs(g),
                y = v / $;
                return 0 === a && (a = 10 * N),
                0 === u && (u = 10 * Y),
                i > y ? (e = p, n = $ * i, t = 0 > d ? h - n: n + h, 0 > t ? (t = 0, s = Math.abs((t - h) / i), e = 0 > g ? f - s: s + f) : t > N && (t = N, s = Math.abs((t - h) / i), e = 0 > g ? f - s: s + f)) : (t = m, s = v / i, e = 0 > g ? f - s: f + s, 0 > e ? (e = 0, n = Math.abs((e - f) * i), t = 0 > d ? h - n: n + h) : e > Y && (e = Y, n = Math.abs(e - f) * i, t = 0 > d ? h - n: n + h)),
                t > h ? (r > t - h ? t = h + r: t - h > a && (t = h + a), e = e > f ? f + (t - h) / i: f - (t - h) / i) : h > t && (r > h - t ? t = h - r: h - t > a && (t = h - a), e = e > f ? f + (h - t) / i: f - (h - t) / i),
                0 > t ? (h -= t, t = 0) : t > N && (h -= t - N, t = N),
                0 > e ? (f -= e, e = 0) : e > Y && (f -= e - Y, e = Y),
                l(o(h, f, t, e))
            }
            function a(t) {
                return t[0] < 0 && (t[0] = 0),
                t[1] < 0 && (t[1] = 0),
                t[0] > N && (t[0] = N),
                t[1] > Y && (t[1] = Y),
                [Math.round(t[0]), Math.round(t[1])]
            }
            function o(t, e, n, s) {
                var i = t,
                r = n,
                a = e,
                o = s;
                return t > n && (i = n, r = t),
                e > s && (a = s, o = e),
                [i, a, r, o]
            }
            function c() {
                var t, e = m - h,
                n = p - f;
                return J && Math.abs(e) > J && (m = e > 0 ? h + J: h - J),
                Q && Math.abs(n) > Q && (p = n > 0 ? f + Q: f - Q),
                te / ne && Math.abs(n) < te / ne && (p = n > 0 ? f + te / ne: f - te / ne),
                Z / ee && Math.abs(e) < Z / ee && (m = e > 0 ? h + Z / ee: h - Z / ee),
                0 > h && (m -= h, h -= h),
                0 > f && (p -= f, f -= f),
                0 > m && (h -= m, m -= m),
                0 > p && (f -= p, p -= p),
                m > N && (t = m - N, h -= t, m -= t),
                p > Y && (t = p - Y, f -= t, p -= t),
                h > N && (t = h - Y, p -= t, f -= t),
                f > Y && (t = f - Y, p -= t, f -= t),
                l(o(h, f, m, p))
            }
            function l(t) {
                return {
                    x: t[0],
                    y: t[1],
                    x2: t[2],
                    y2: t[3],
                    w: t[2] - t[0],
                    h: t[3] - t[1]
                }
            }
            var u, d, h = 0,
            f = 0,
            m = 0,
            p = 0;
            return {
                flipCoords: o,
                setPressed: t,
                setCurrent: e,
                getOffset: n,
                moveOffset: s,
                getCorner: i,
                getFixed: r
            }
        } (),
        he = function() {
            function e(t, e) {
                m.left.css({
                    height: s(e)
                }),
                m.right.css({
                    height: s(e)
                })
            }
            function n() {
                return i(de.getFixed())
            }
            function i(t) {
                m.top.css({
                    left: s(t.x),
                    width: s(t.w),
                    height: s(t.y)
                }),
                m.bottom.css({
                    top: s(t.y2),
                    left: s(t.x),
                    width: s(t.w),
                    height: s(Y - t.y2)
                }),
                m.right.css({
                    left: s(t.x2),
                    width: s(N - t.x2)
                }),
                m.left.css({
                    width: s(t.x)
                })
            }
            function r() {
                return t("<div />").css({
                    position: "absolute",
                    backgroundColor: E.shadeColor || E.bgColor
                }).appendTo(f)
            }
            function a() {
                h || (h = !0, f.insertBefore(U), n(), fe.setBgOpacity(1, 0, 1), K.hide(), o(E.shadeColor || E.bgColor, 1), fe.isAwake() ? l(E.bgOpacity, 1) : l(1, 1))
            }
            function o(t, e) {
                A(d(), t, e)
            }
            function c() {
                h && (f.remove(), K.show(), h = !1, fe.isAwake() ? fe.setBgOpacity(E.bgOpacity, 1, 1) : (fe.setBgOpacity(1, 1, 1), fe.disableHandles()), A(W, 0, 1))
            }
            function l(t, e) {
                h && (E.bgFade && !e ? f.animate({
                    opacity: 1 - t
                },
                {
                    queue: !1,
                    duration: E.fadeTime
                }) : f.css({
                    opacity: 1 - t
                }))
            }
            function u() {
                E.shade ? a() : c(),
                fe.isAwake() && l(E.bgOpacity)
            }
            function d() {
                return f.children()
            }
            var h = !1,
            f = t("<div />").css({
                position: "absolute",
                zIndex: 240,
                opacity: 0
            }),
            m = {
                top: r(),
                left: r().height(Y),
                right: r().height(Y),
                bottom: r()
            };
            return {
                update: n,
                updateRaw: i,
                getShades: d,
                setBgColor: o,
                enable: a,
                disable: c,
                resize: e,
                refresh: u,
                opacity: l
            }
        } (),
        fe = function() {
            function e(e) {
                var n = t("<div />").css({
                    position: "absolute",
                    opacity: E.borderOpacity
                }).addClass(i(e));
                return G.append(n),
                n
            }
            function n(e, n) {
                var s = t("<div />").mousedown(f(e)).css({
                    cursor: e + "-resize",
                    position: "absolute",
                    zIndex: n
                }).addClass("ord-" + e);
                return ue.support && s.bind("touchstart.jcrop", ue.createDragger(e)),
                X.append(s),
                s
            }
            function r(t) {
                var e = E.handleSize,
                s = n(t, _++).css({
                    opacity: E.handleOpacity
                }).addClass(i("handle"));
                return e && s.width(e).height(e),
                s
            }
            function a(t) {
                return n(t, _++).addClass("jcrop-dragbar")
            }
            function o(t) {
                var e;
                for (e = 0; e < t.length; e++) M[t[e]] = a(t[e])
            }
            function c(t) {
                var n, s;
                for (s = 0; s < t.length; s++) {
                    switch (t[s]) {
                    case "n":
                        n = "hline";
                        break;
                    case "s":
                        n = "hline bottom";
                        break;
                    case "e":
                        n = "vline right";
                        break;
                    case "w":
                        n = "vline"
                    }
                    T[t[s]] = e(n)
                }
            }
            function l(t) {
                var e;
                for (e = 0; e < t.length; e++) D[t[e]] = r(t[e])
            }
            function u(t, e) {
                E.shade || K.css({
                    top: s( - e),
                    left: s( - t)
                }),
                V.css({
                    top: s(e),
                    left: s(t)
                })
            }
            function d(t, e) {
                V.width(Math.round(t)).height(Math.round(e))
            }
            function h() {
                var t = de.getFixed();
                de.setPressed([t.x, t.y]),
                de.setCurrent([t.x2, t.y2]),
                m()
            }
            function m(t) {
                return S ? g(t) : void 0
            }
            function g(t) {
                var e = de.getFixed();
                d(e.w, e.h),
                u(e.x, e.y),
                E.shade && he.updateRaw(e),
                S || $(),
                t ? E.onSelect.call(ge, p(e)) : E.onChange.call(ge, p(e))
            }
            function v(t, e, n) { (S || e) && (E.bgFade && !n ? U.animate({
                    opacity: t
                },
                {
                    queue: !1,
                    duration: E.fadeTime
                }) : U.css("opacity", t))
            }
            function $() {
                V.show(),
                E.shade ? he.opacity(le) : v(le, !0),
                S = !0
            }
            function b() {
                x(),
                V.hide(),
                E.shade ? he.opacity(1) : v(1),
                S = !1,
                E.onRelease.call(ge)
            }
            function j() {
                P && X.show()
            }
            function w() {
                return P = !0,
                E.allowResize ? (X.show(), !0) : void 0
            }
            function x() {
                P = !1,
                X.hide()
            }
            function C(t) {
                t ? (ie = !0, x()) : (ie = !1, w())
            }
            function k() {
                C(!1),
                h()
            }
            var S, _ = 370,
            T = {},
            D = {},
            M = {},
            P = !1;
            E.dragEdges && t.isArray(E.createDragbars) && o(E.createDragbars),
            t.isArray(E.createHandles) && l(E.createHandles),
            E.drawBorders && t.isArray(E.createBorders) && c(E.createBorders),
            t(document).bind("touchstart.jcrop-ios",
            function(e) {
                t(e.currentTarget).hasClass("jcrop-tracker") && e.stopPropagation()
            });
            var A = y().mousedown(f("move")).css({
                cursor: "move",
                position: "absolute",
                zIndex: 360
            });
            return ue.support && A.bind("touchstart.jcrop", ue.createDragger("move")),
            G.append(A),
            x(),
            {
                updateVisible: m,
                update: g,
                release: b,
                refresh: h,
                isAwake: function() {
                    return S
                },
                setCursor: function(t) {
                    A.css("cursor", t)
                },
                enableHandles: w,
                enableOnly: function() {
                    P = !0
                },
                showHandles: j,
                disableHandles: x,
                animMode: C,
                setBgOpacity: v,
                done: k
            }
        } (),
        me = function() {
            function e(e) {
                oe.css({
                    zIndex: 450
                }),
                e ? t(document).bind("touchmove.jcrop", a).bind("touchend.jcrop", c) : h && t(document).bind("mousemove.jcrop", s).bind("mouseup.jcrop", i)
            }
            function n() {
                oe.css({
                    zIndex: 290
                }),
                t(document).unbind(".jcrop")
            }
            function s(t) {
                return u(o(t)),
                !1
            }
            function i(t) {
                return t.preventDefault(),
                t.stopPropagation(),
                se && (se = !1, d(o(t)), fe.isAwake() && E.onSelect.call(ge, p(de.getFixed())), n(), u = function() {},
                d = function() {}),
                !1
            }
            function r(t, n, s) {
                return se = !0,
                u = t,
                d = n,
                e(s),
                !1
            }
            function a(t) {
                return u(o(ue.cfilter(t))),
                !1
            }
            function c(t) {
                return i(ue.cfilter(t))
            }
            function l(t) {
                oe.css("cursor", t)
            }
            var u = function() {},
            d = function() {},
            h = E.trackDocument;
            return h || oe.mousemove(s).mouseup(i).mouseout(i),
            U.before(oe),
            {
                activateHandlers: r,
                setCursor: l
            }
        } (),
        pe = function() {
            function e() {
                E.keySupport && (r.show(), r.focus())
            }
            function n() {
                r.hide()
            }
            function s(t, e, n) {
                E.allowMove && (de.moveOffset([e, n]), fe.updateVisible(!0)),
                t.preventDefault(),
                t.stopPropagation()
            }
            function i(t) {
                if (t.ctrlKey || t.metaKey) return ! 0;
                re = t.shiftKey ? !0 : !1;
                var e = re ? 10 : 1;
                switch (t.keyCode) {
                case 37:
                    s(t, -e, 0);
                    break;
                case 39:
                    s(t, e, 0);
                    break;
                case 38:
                    s(t, 0, -e);
                    break;
                case 40:
                    s(t, 0, e);
                    break;
                case 27:
                    E.allowSelect && fe.release();
                    break;
                case 9:
                    return ! 0
                }
                return ! 1
            }
            var r = t('<input type="radio" />').css({
                position: "fixed",
                left: "-120px",
                width: "12px"
            }).addClass("jcrop-keymgr"),
            a = t("<div />").css({
                position: "absolute",
                overflow: "hidden"
            }).append(r);
            return E.keySupport && (r.keydown(i).blur(n), z || !E.fixedSupport ? (r.css({
                position: "absolute",
                left: "-20px"
            }), a.append(r).insertBefore(U)) : r.insertBefore(U)),
            {
                watchKeys: e
            }
        } ();
        ue.support && oe.bind("touchstart.jcrop", ue.newSelection),
        X.hide(),
        B(!0);
        var ge = {
            setImage: P,
            animateTo: j,
            setSelect: w,
            setOptions: S,
            tellSelect: C,
            tellScaled: k,
            setClass: b,
            disable: _,
            enable: T,
            cancel: D,
            release: fe.release,
            destroy: M,
            focus: pe.watchKeys,
            getBounds: function() {
                return [N * ee, Y * ne]
            },
            getWidgetSize: function() {
                return [N, Y]
            },
            getScaleFactor: function() {
                return [ee, ne]
            },
            getOptions: function() {
                return E
            },
            ui: {
                holder: W,
                selection: V
            }
        };
        return I && W.bind("selectstart",
        function() {
            return ! 1
        }),
        O.data("Jcrop", ge),
        ge
    },
    t.fn.Jcrop = function(e, n) {
        var s;
        return this.each(function() {
            if (t(this).data("Jcrop")) {
                if ("api" === e) return t(this).data("Jcrop");
                t(this).data("Jcrop").setOptions(e)
            } else "IMG" == this.tagName ? t.Jcrop.Loader(this,
            function() {
                t(this).css({
                    display: "block",
                    visibility: "hidden"
                }),
                s = t.Jcrop(this, e),
                t.isFunction(n) && n.call(s)
            }) : (t(this).css({
                display: "block",
                visibility: "hidden"
            }), s = t.Jcrop(this, e), t.isFunction(n) && n.call(s))
        }),
        this
    },
    t.Jcrop.Loader = function(e, n, s) {
        function i() {
            a.complete ? (r.unbind(".jcloader"), t.isFunction(n) && n.call(a)) : window.setTimeout(i, 50)
        }
        var r = t(e),
        a = r[0];
        r.bind("load.jcloader", i).bind("error.jcloader",
        function() {
            r.unbind(".jcloader"),
            t.isFunction(s) && s.call(a)
        }),
        a.complete && t.isFunction(n) && (r.unbind(".jcloader"), n.call(a))
    },
    t.Jcrop.defaults = {
        allowSelect: !0,
        allowMove: !0,
        allowResize: !0,
        trackDocument: !0,
        baseClass: "jcrop",
        addClass: null,
        bgColor: "black",
        bgOpacity: .6,
        bgFade: !1,
        borderOpacity: .4,
        handleOpacity: .5,
        handleSize: null,
        aspectRatio: 0,
        keySupport: !0,
        createHandles: ["n", "s", "e", "w", "nw", "ne", "se", "sw"],
        createDragbars: ["n", "s", "e", "w"],
        createBorders: ["n", "s", "e", "w"],
        drawBorders: !0,
        dragEdges: !0,
        fixedSupport: !0,
        touchSupport: null,
        shade: null,
        boxWidth: 0,
        boxHeight: 0,
        boundary: 2,
        fadeTime: 400,
        animationDelay: 20,
        swingSpeed: 3,
        minSelect: [0, 0],
        maxSize: [0, 0],
        minSize: [0, 0],
        onChange: function() {},
        onSelect: function() {},
        onDblClick: function() {},
        onRelease: function() {}
    }
} (jQuery),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t(t) {
            this.showSize = e(this.showSize, this),
            this.onSelect = e(this.onSelect, this);
            var n, s, i, r, a;
            this.container = $(t),
            this.img = this.container.find(".js-croppable-avatar"),
            this.croppedX = this.container.find(".js-crop-cropped_x"),
            this.croppedY = this.container.find(".js-crop-cropped_y"),
            this.croppedW = this.container.find(".js-crop-cropped_width"),
            this.croppedH = this.container.find(".js-crop-cropped_height"),
            this.previewWidth = this.previewHeight = null,
            s = {
                aspectRatio: 1,
                onSelect: this.onSelect,
                bgColor: "",
                minSize: [50, 50],
                maxSize: [3e3, 3e3],
                boxWidth: 689,
                boxHeight: 689
            },
            r = parseInt(this.croppedX.val()),
            a = parseInt(this.croppedY.val()),
            i = parseInt(this.croppedW.val()),
            n = parseInt(this.croppedH.val()),
            i > 0 && n > 0 && (s.setSelect = [r, a, r + i, a + n]),
            this.img.Jcrop(s)
        }
        return t.prototype.onSelect = function(t) {
            return this.croppedX.val(t.x),
            this.croppedY.val(t.y),
            this.croppedW.val(t.w),
            this.croppedH.val(t.h),
            this.showSize(t)
        },
        t.prototype.showSize = function(t) {
            var e, n;
            return this.previewWidth || (e = '<div class="avatar-crop-preview">\n  <span class="js-avatar-width avatar-point"></span>x<span class="js-avatar-height avatar-point"></span>\n</div>', n = this.container.find(".jcrop-holder div")[0], $(n).prepend(e), this.previewWidth = this.container.find(".js-avatar-width"), this.previewHeight = this.container.find(".js-avatar-height")),
            this.previewWidth.text(Math.round(t.w)),
            this.previewHeight.text(Math.round(t.h))
        },
        t
    } (),
    $.observe(".js-croppable-container", {
        add: function(e) {
            return new t(e)
        }
    })
}.call(this),
function() {
    var t;
    t = function(t) {
        var e, n, s, i;
        for (i = $(t).attr("data-confirm").toLowerCase().split(","), n = 0, s = i.length; s > n; n++) if (e = i[n], t.value.toLowerCase() === e) return ! 0;
        return ! 1
    },
    $(document).onFocusedInput(".js-dangerous-confirmation .confirm-input",
    function() {
        var e, n;
        return e = $(this).closest(".js-dangerous-confirmation"),
        n = e.find(".confirm-button")[0],
        function() {
            n.disabled = !t(this)
        }
    })
}.call(this),
function() {
    $.observe(".js-ds",
    function() {
        var t, e; (e = this.getAttribute("data-url")) && (t = new XMLHttpRequest, t.open("GET", e, !0), t.setRequestHeader("X-Requested-With", "XMLHttpRequest"), t.send())
    })
}.call(this),
function() {
    var t;
    t = function(t, e) {
        var n;
        return n = document.createElement("img"),
        n.src = "" + t + "/u/" + e
    },
    $(function() {
        var e;
        return e = $("#js-avatars").data("url"),
        e && "" !== e ? $(".js-avatar").each(function() {
            var n;
            return n = $(this).data("user"),
            n > 0 ? t(e, n) : void 0
        }) : void 0
    })
}.call(this),
function() {
    $(document).on("details:toggled",
    function(t) {
        var e;
        return e = $(t.target).find("input[autofocus], textarea[autofocus]").last()[0],
        e && document.activeElement !== e ? e.focus() : void 0
    })
}.call(this),
function() {
    var t, e;
    $(document).on("reveal.facebox",
    function() {
        var t, n;
        t = $("#facebox"),
        t.pageUpdate(),
        n = t.find("input[autofocus], textarea[autofocus]").last()[0],
        n && document.activeElement !== n && n.focus(),
        $(document).on("keydown", e)
    }),
    $(document).on("afterClose.facebox",
    function() {
        return $(document).off("keydown", e),
        $("#facebox :focus").blur()
    }),
    e = function(t) {
        var e, n, s, i, r, a; ("tab" === (a = t.hotkey) || "shift+tab" === a) && (t.preventDefault(), n = $("#facebox"), e = n.find("input, .button, textarea").visible(), i = "shift+tab" === t.hotkey ? -1 : 1, s = e.index(e.filter(":focus")), r = s + i, r === e.length || -1 === s && "tab" === t.hotkey ? e.first().focus() : -1 === s ? e.last().focus() : e.get(r).focus())
    },
    $.observe("a[rel*=facebox]", t = function() {
        $(this).facebox()
    })
}.call(this),
function() {
    $(document).on("click", ".js-flash-close",
    function() {
        var t;
        return t = $(this).closest(".flash-messages"),
        $(this).closest(".flash").fadeOut(300,
        function() {
            return $(this).remove(),
            0 === t.find(".flash").length ? t.remove() : void 0
        })
    })
}.call(this),
function() {
    var t, e, n, s;
    e = function(t) {
        var e, s, i, r, a, o, c, l, u, d;
        if (s = document.getElementById(t)) return a = document.getElementById("fullscreen_overlay"),
        o = $(a).find(".js-fullscreen-contents"),
        l = "gh-fullscreen-theme",
        "dark" === localStorage.getItem(l) ? ($(".js-fullscreen-overlay").addClass("dark-theme"), c = "dark") : ($(".js-fullscreen-overlay").removeClass("dark-theme"), c = "light"),
        d = $(s).val(),
        e = $(s).caret(),
        $(a).attr("data-return-scroll-position", window.pageYOffset),
        $("body").addClass("fullscreen-overlay-enabled"),
        $(document).on("keydown", n),
        $(o).attr("placeholder", $(s).attr("placeholder")),
        $(o).val(d),
        $(o).caret(e),
        o.focus(),
        r = "gh-fullscreen-known-user",
        i = "known" === localStorage.getItem(r),
        i || localStorage.setItem(r, "known"),
        u = "other",
        t.match(/pull_request_body/g) ? u = "pull": t.match(/issue_body/g) ? u = "issue": t.match(/blob_contents/g) ? u = "blob": t.match(/comment_body/g) && (u = "comment"),
        $.ajax({
            url: "/_stats",
            data: {
                zenstats: {
                    unique: !i,
                    use_case: u,
                    theme: c
                }
            }
        })
    },
    t = function(t) {
        var e, s, i, r, a, o;
        if (s = document.getElementById(t)) return i = document.getElementById("fullscreen_overlay"),
        a = $(i).find(".js-fullscreen-contents"),
        o = $(a).val(),
        e = $(a).caret(),
        $("body").removeClass("fullscreen-overlay-enabled"),
        $(document).off("keydown", n),
        (r = $(i).attr("data-return-scroll-position")) && window.scrollTo(0, r),
        null != window.editor ? window.editor.setCode(o) : ($(s).val(o), $(s).caret(e), $(s).trigger("validation:field:change")),
        a.val("")
    },
    s = !1,
    n = function(t) {
        return 27 === t.keyCode || "ctrl+L" === t.hotkey || "meta+L" === t.hotkey ? (s ? history.back() : window.location.hash = "", t.preventDefault()) : void 0
    },
    $(document).on("click", ".js-exit-fullscreen",
    function(t) {
        s && (t.preventDefault(), history.back())
    }),
    $(document).on("click", ".js-theme-switcher",
    function() {
        var t;
        return t = "gh-fullscreen-theme",
        "dark" === localStorage.getItem(t) ? (localStorage.removeItem(t), $("body, .js-fullscreen-overlay").removeClass("dark-theme")) : (localStorage.setItem(t, "dark"), $("body, .js-fullscreen-overlay").addClass("dark-theme")),
        !1
    }),
    $.hashChange(function(n) {
        var i, r, a;
        return a = n.oldURL,
        r = n.newURL,
        (i = null != r ? r.match(/\#fullscreen_(.+)$/) : void 0) ? (s = !!a, e(i[1])) : (i = null != a ? a.match(/\#fullscreen_(.+)$/) : void 0) ? (s = !1, t(i[1])) : void 0
    }),
    "dark" === ("undefined" != typeof localStorage && null !== localStorage ? localStorage["gh-fullscreen-theme"] : void 0) && $(function() {
        return $("body, .js-fullscreen-overlay").addClass("dark-theme")
    })
}.call(this),
function() {
    var t, e, n, s;
    n = {},
    e = function(t) {
        var s;
        t.preventDefault(),
        (s = n[t.hotkey]) && $(s).fire("gotokey:activate", {
            originalEvent: t
        },
        function() {
            $(s).click()
        }),
        $(document).off("keydown", e)
    },
    $(document).on("keydown",
    function(t) {
        t.target === document.body && "g" === t.hotkey && (t.preventDefault(), $(document).on("keydown", e), setTimeout(function() {
            return $(document).off("keydown", e)
        },
        1500))
    }),
    t = function(t) {
        var e;
        e = t.getAttribute("data-gotokey"),
        n[e] = t
    },
    s = function(t) {
        var e;
        e = t.getAttribute("data-gotokey"),
        delete n[e]
    },
    $.observe("[data-gotokey]", {
        add: t,
        remove: s
    })
}.call(this),
function() {
    var t;
    t = document.referrer,
    $(document).on("pjax:start",
    function() {
        return t = $.pjax.state.url
    }),
    $(document).on("click", ".js-history-back",
    function(e) {
        1 !== e.which || e.metaKey || e.ctrlKey || this.href === t && history.length > 1 && (history.back(), e.preventDefault())
    })
}.call(this),
function() {
    $.observe(".labeled-button:checked", {
        add: function() {
            return $(this).parent("label").addClass("selected")
        },
        remove: function() {
            return $(this).parent("label").removeClass("selected")
        }
    })
}.call(this),
function() {
    $(document).on("keydown", "div.minibutton, span.minibutton",
    function(t) {
        return "enter" === t.hotkey ? ($(this).click(), t.preventDefault()) : void 0
    })
}.call(this),
function() {
    $(document).on("ajaxSuccess", ".js-notice-dismiss",
    function() {
        return $(this).closest(".js-notice").fadeOut()
    }),
    $(document).on("ajaxError", ".js-notice-dismiss",
    function() {
        return alert("Failed to dismiss notice. Sorry!")
    })
}.call(this),
function() {
    $.support.pjax && ($(document).on("pjax:start",
    function(t) {
        var e; (e = t.relatedTarget) && ($(e).addClass("pjax-active"), $(e).parents(".js-pjax-active").addClass("pjax-active"))
    }), $(document).on("pjax:end",
    function() {
        $(".pjax-active").removeClass("pjax-active")
    }))
}.call(this),
function() {
    var t;
    t = function() {
        var t, e;
        return e = function() {
            var e, n, s;
            for (s = [], e = 0, n = arguments.length; n > e; e++) t = arguments[e],
            s.push(t.split("/", 3).join("/"));
            return s
        }.apply(this, arguments),
        e[0] === e[1]
    },
    $(document).on("pjax:click", "#js-repo-pjax-container a[href]",
    function() {
        var e;
        return e = $(this).prop("pathname"),
        t(e, location.pathname) ? void 0 : !1
    })
}.call(this),
function() {
    var t;
    $.support.pjax && ($.pjax.defaults.fragment = "#pjax-body", $.pjaxHeadCache = [], $(t = function() {
        return $.pjaxHeadCache[document.location.pathname] = $("head [data-pjax-transient]")
    }), $(document).on("pjax:success",
    function(t, e) {
        var n;
        return n = $.parseHTML(e)[0],
        "pjax-head" === n.id ? $.pjaxHeadCache[document.location.pathname] = $(n).children() : void 0
    }), $(document).on("pjax:end",
    function() {
        var t, e, n;
        return t = $.pjaxHeadCache[document.location.pathname],
        t ? ($("head [data-pjax-transient]").remove(), n = $(t).not("title, script, link[rel='stylesheet']"), e = $(t).filter("link[rel='stylesheet']"), $(document.head).append(n.attr("data-pjax-transient", !0)), $(document.head).append(e)) : void 0
    }))
}.call(this),
function() {
    var t;
    $.support.pjax && (t = function(t) {
        return $(t).is("[data-pjax-preserve-scroll]") ? !1 : 0
    },
    $(document).on("click", "[data-pjax] a, a[data-pjax]",
    function(e) {
        var n, s, i;
        if (!$(this).is("[data-skip-pjax]") && !$(this).is("[data-remote]")) return s = $(this).is("[data-pjax]") ? this: $(this).closest("[data-pjax]")[0],
        i = t(this),
        (n = $(this).closest("[data-pjax-container]")[0]) ? $.pjax.click(e, {
            container: n,
            scrollTo: i
        }) : void 0
    }), $(document).on("submit", "form[data-pjax]",
    function(e) {
        var n, s;
        return s = t(this),
        (n = $(this).closest("[data-pjax-container]")[0]) ? $.pjax.submit(e, {
            container: n,
            scrollTo: s
        }) : void 0
    }))
}.call(this),
function() {
    $.support.pjax && ($.pjax.defaults.timeout = 1e3)
}.call(this),
function(t) {
    function e() {
        return 1 == m ? !1 : void 0 != window.DeviceOrientationEvent
    }
    function n(t) {
        if (x = t.gamma, y = t.beta, 90 === Math.abs(window.orientation)) {
            var e = x;
            x = y,
            y = e
        }
        return window.orientation < 0 && (x = -x, y = -y),
        h = null == h ? x: h,
        f = null == f ? y: f,
        {
            x: x - h,
            y: y - f
        }
    }
    function s(t) {
        if (! ((new Date).getTime() < a + r)) {
            a = (new Date).getTime();
            var s = null != c.offset() ? c.offset().left: 0,
            i = null != c.offset() ? c.offset().top: 0,
            h = t.pageX - s,
            f = t.pageY - i;
            if (! (0 > h || h > c.width() || 0 > f || f > c.height())) {
                if (e()) {
                    if (void 0 == t.gamma) return m = !0,
                    void 0;
                    values = n(t),
                    h = values.x / l,
                    f = values.y / l,
                    h = d > h ? d: h > u ? u: h,
                    f = d > f ? d: f > u ? u: f,
                    h = (h + 1) / 2,
                    f = (f + 1) / 2
                }
                var p, g, v = h / (1 == e() ? u: c.width()),
                $ = f / (1 == e() ? u: c.height());
                for (g = o.length; g--;) p = o[g],
                newX = p.startX + p.inversionFactor * p.xRange * v,
                newY = p.startY + p.inversionFactor * p.yRange * $,
                p.background ? p.obj.css("background-position", newX + "px " + newY + "px") : p.obj.css("left", newX).css("top", newY)
            }
        }
    }
    var i = 25,
    r = 1e3 * (1 / i),
    a = (new Date).getTime(),
    o = [],
    c = t(window),
    l = 30,
    u = 1,
    d = -1,
    h = null,
    f = null,
    m = !1;
    t.fn.plaxify = function(e) {
        return this.each(function() {
            for (var n = -1,
            s = {
                xRange: t(this).data("xrange") || 0,
                yRange: t(this).data("yrange") || 0,
                invert: t(this).data("invert") || !1,
                background: t(this).data("background") || !1
            },
            i = 0; i < o.length; i++) this === o[i].obj.get(0) && (n = i);
            for (var r in e) 0 == s[r] && (s[r] = e[r]);
            if (s.inversionFactor = s.invert ? -1 : 1, s.obj = t(this), s.background) {
                if (pos = (s.obj.css("background-position") || "0px 0px").split(/ /), 2 != pos.length) return;
                if (x = pos[0].match(/^((-?\d+)\s*px|0+\s*%|left)$/), y = pos[1].match(/^((-?\d+)\s*px|0+\s*%|top)$/), !x || !y) return;
                s.originX = s.startX = x[2] || 0,
                s.originY = s.startY = y[2] || 0
            } else {
                var a = s.obj.position();
                s.obj.css({
                    top: a.top,
                    left: a.left,
                    right: "",
                    bottom: ""
                }),
                s.originX = s.startX = a.left,
                s.originY = s.startY = a.top
            }
            s.startX -= s.inversionFactor * Math.floor(s.xRange / 2),
            s.startY -= s.inversionFactor * Math.floor(s.yRange / 2),
            n >= 0 ? o.splice(n, 1, s) : o.push(s)
        })
    },
    t.plax = {
        enable: function(n) {
            n && (n.activityTarget && (c = n.activityTarget || t(window)), "number" == typeof n.gyroRange && n.gyroRange > 0 && (l = n.gyroRange)),
            t(document).bind("mousemove.plax",
            function(t) {
                s(t)
            }),
            e() && (window.ondeviceorientation = function(t) {
                s(t)
            })
        },
        disable: function(e) {
            if (t(document).unbind("mousemove.plax"), window.ondeviceorientation = void 0, e && "boolean" == typeof e.restorePositions && e.restorePositions) for (var n = o.length; n--;) layer = o[n],
            o[n].background ? layer.obj.css("background-position", layer.originX + "px " + layer.originY + "px") : layer.obj.css("left", layer.originX).css("top", layer.originY);
            e && "boolean" == typeof e.clearLayers && e.clearLayers && (o = [])
        }
    },
    "undefined" != typeof ender && t.ender(t.fn, !0)
} (function() {
    return "undefined" != typeof jQuery ? jQuery: ender
} ()),
function() {
    var t, e, n;
    e = 0,
    n = function(t) {
        var n;
        return e++,
        n = $(t),
        n.plaxify({
            xRange: n.data("xrange") || 0,
            yRange: n.data("yrange") || 0,
            invert: n.data("invert") || !1
        }),
        1 === e ? $.plax.enable() : void 0
    },
    t = function() {
        return e--,
        0 === e ? $.plax.disable({
            clearLayers: !0,
            restorePositions: !0
        }) : void 0
    },
    $.observe(".js-plaxify", {
        add: n,
        remove: t
    })
}.call(this),
function() {
    $.observe(".js-poll",
    function(t) {
        $.ajaxPoll({
            context: t,
            url: $(t).attr("data-url")
        })
    })
}.call(this),
function() {
    $(function() {
        return $(document.body).hasClass("js-print-popup") ? (window.print(), setTimeout(window.close, 1e3)) : void 0
    })
}.call(this),
function() {
    $(document).onFocusedKeydown(".js-quick-submit",
    function() {
        return function(t) {
            return "ctrl+enter" === t.hotkey || "meta+enter" === t.hotkey ? ($(this).closest("form").submit(), !1) : void 0
        }
    })
}.call(this),
function() {
    $(document).on("click", ".js-reload",
    function() {
        return window.location.reload(),
        !1
    })
}.call(this),
function() {
    $(document).on("focusin", ".js-repo-filter .js-filterable-field",
    function() {
        return $(this).closest(".js-repo-filter").find(".js-more-repos-link").click()
    }),
    $(document).on("click", ".js-repo-filter .js-repo-filter-tab",
    function() {
        var t;
        return t = $(this).closest(".js-repo-filter"),
        t.find(".js-more-repos-link").click(),
        t.find(".js-repo-filter-tab").removeClass("filter-selected"),
        $(this).addClass("filter-selected"),
        t.find(".js-filterable-field").fire("filterable:change"),
        !1
    }),
    $(document).on("filterable:change", ".js-repo-filter .js-repo-list",
    function() {
        var t, e;
        t = $(this).closest(".js-repo-filter"),
        (e = t.find(".js-repo-filter-tab.filter-selected").attr("data-filter")) && $(this).children().not(e).hide()
    }),
    $(document).on("click:prepare", ".js-repo-filter .js-more-repos-link",
    function() {
        return $(this).hasClass("is-loading") ? !1 : void 0
    }),
    $(document).on("ajaxSend", ".js-repo-filter .js-more-repos-link",
    function() {
        return $(this).addClass("is-loading")
    }),
    $(document).on("ajaxComplete", ".js-repo-filter .js-more-repos-link",
    function() {
        return $(this).removeClass("is-loading")
    }),
    $(document).on("ajaxSuccess", ".js-repo-filter .js-more-repos-link",
    function(t, e, n, s) {
        var i;
        return i = $(this).closest(".js-repo-filter"),
        i.find(".js-repo-list").html(s).pageUpdate(),
        i.find(".js-filterable-field").fire("filterable:change"),
        $(this).remove()
    })
}.call(this),
function() {
    var t;
    $(function() {
        return $(".js-target-repo-menu")[0] ? $(".js-owner-select").trigger("change") : void 0
    }),
    $(document).on("change", ".js-owner-select",
    function() {
        var t, e, n, s;
        return n = $(this).parents(".js-repo-selector"),
        s = $(this).find(".selected input").val(),
        t = $(n).find(".js-target-repo-menu"),
        e = $(n).find(".js-target-repo-menu[data-owner='" + s + "']"),
        t.removeClass("owner-is-active"),
        e.addClass("owner-is-active")
    }),
    $(document).on("click", ".js-repo-selector-add",
    function(e) {
        var n, s, i;
        return e.preventDefault(),
        i = $(this).parents(".js-repo-selector"),
        n = $(i).find(".js-owner-select").find(".selected .js-select-button-text").text().trim(),
        s = $(i).find(".js-target-repo-menu.owner-is-active").find(".selected .js-select-button-text").text().trim(),
        n.length && s.length ? t(i, n, s) : void 0
    }),
    $(document).on("click", ".js-repo-entry-remove",
    function(t) {
        var e;
        return e = $(this).parents(".js-repo-selector"),
        $(this).parents(".js-repo-entry").remove(),
        0 === $(e).find(".js-repo-entry").visible().length && $(e).find(".js-repo-select-blank").removeClass("hidden"),
        t.preventDefault()
    }),
    t = function(t, e, n) {
        var s;
        return s = $(t).find(".js-repo-entry-template").clone().removeClass("hidden js-repo-entry-template"),
        s.find(".js-entry-owner").text(e),
        s.find(".js-entry-repo").text(n),
        $(t).find(".js-repo-entry-list").append(s),
        $(t).find(".js-repo-select-blank").addClass("hidden")
    }
}.call(this),
function() {
    $(document).on("ajaxSuccess", ".js-select-menu:not([data-multiple])",
    function() {
        return $(this).menu("deactivate")
    }),
    $(document).on("ajaxSend", ".js-select-menu:not([data-multiple])",
    function() {
        return $(this).addClass("is-loading")
    }),
    $(document).on("ajaxComplete", ".js-select-menu",
    function() {
        return $(this).removeClass("is-loading")
    }),
    $(document).on("ajaxError", ".js-select-menu",
    function() {
        return $(this).addClass("has-error")
    }),
    $(document).on("menu:deactivate", ".js-select-menu",
    function() {
        return $(this).removeClass("is-loading has-error")
    })
}.call(this),
function() {
    $(document).on("selectmenu:selected", ".js-select-menu .js-navigation-item",
    function() {
        var t, e, n;
        return t = $(this).closest(".js-select-menu"),
        n = $(this).find(".js-select-button-text"),
        n[0] && t.find(".js-select-button").html(n.html()),
        e = $(this).find(".js-select-menu-item-gravatar"),
        n[0] ? t.find(".js-select-button-gravatar").html(e.html()) : void 0
    })
}.call(this),
function() {
    $(document).on("selectmenu:change", ".js-select-menu .select-menu-list",
    function(t) {
        var e, n;
        n = $(this).find(".js-navigation-item"),
        n.removeClass("last-visible"),
        n.visible().last().addClass("last-visible"),
        $(this).is("[data-filterable-for]") || (e = $(t.target).hasClass("filterable-empty"), $(this).toggleClass("filterable-empty", e))
    })
}.call(this),
function() {
    $(document).on("menu:activated selectmenu:load", ".js-select-menu",
    function() {
        return $(this).find(".js-filterable-field").focus()
    }),
    $(document).on("menu:deactivate", ".js-select-menu",
    function() {
        return $(this).find(".js-filterable-field").val("").trigger("filterable:change")
    })
}.call(this),
function() {
    $(document).on("navigation:open", ".js-select-menu:not([data-multiple]) .js-navigation-item",
    function() {
        var t, e;
        return e = $(this),
        t = e.closest(".js-select-menu"),
        t.find(".js-navigation-item.selected").removeClass("selected"),
        e.addClass("selected"),
        e.find("input[type=radio], input[type=checkbox]").prop("checked", !0).change(),
        e.fire("selectmenu:selected"),
        t.hasClass("is-loading") ? void 0 : t.menu("deactivate")
    }),
    $(document).on("navigation:open", ".js-select-menu[data-multiple] .js-navigation-item",
    function() {
        var t, e;
        return t = $(this),
        e = t.hasClass("selected"),
        t.toggleClass("selected", !e),
        t.find("input[type=radio], input[type=checkbox]").prop("checked", !e).change(),
        t.fire("selectmenu:selected")
    })
}.call(this),
function() {
    var t;
    t = function(e) {
        var n, s, i, r;
        return s = e.currentTarget,
        n = $(s),
        i = n.attr("data-contents-url"),
        n.removeAttr("data-contents-url"),
        $(s).off("mouseenter", t),
        $(s).off("menu:activate", t),
        r = $.ajax({
            url: i
        }),
        r.then(function(t) {
            n.removeClass("is-loading"),
            n.find(".js-select-menu-deferred-content").replaceContent(t),
            n.hasClass("active") && n.fire("selectmenu:load")
        },
        function() {
            n.removeClass("is-loading"),
            n.addClass("has-error")
        })
    },
    $.observe(".js-select-menu[data-contents-url]",
    function() {
        $(this).on("mouseenter", t),
        $(this).on("menu:activate", t)
    })
}.call(this),
function() {
    $(document).on("menu:activate", ".js-select-menu",
    function() {
        return $(this).find(":focus").blur(),
        $(this).find(".js-menu-target").addClass("selected"),
        $(this).find(".js-navigation-container").navigation("push")
    }),
    $(document).on("menu:deactivate", ".js-select-menu",
    function() {
        return $(this).find(".js-menu-target").removeClass("selected"),
        $(this).find(".js-navigation-container").navigation("pop")
    }),
    $(document).on("filterable:change selectmenu:tabchange", ".js-select-menu .select-menu-list",
    function() {
        return $(this).navigation("refocus")
    })
}.call(this),
function() {
    var t;
    $(document).on("filterable:change", ".js-select-menu .select-menu-list",
    function(e) {
        var n, s; (s = $(this).find(".js-new-item-form")[0]) && (n = e.relatedTarget.value, "" === n || t(this, n) ? $(this).removeClass("is-showing-new-item-form") : ($(this).addClass("is-showing-new-item-form"), $(s).find(".js-new-item-name").text(n), $(s).find(".js-new-item-value").val(n))),
        $(e.target).trigger("selectmenu:change")
    }),
    t = function(t, e) {
        var n, s, i, r, a;
        for (a = $(t).find(".js-select-button-text"), i = 0, r = a.length; r > i; i++) if (n = a[i], s = $.trim($(n).text().toLowerCase()), s === e.toLowerCase()) return ! 0;
        return ! 1
    }
}.call(this),
function() {
    var t;
    $(document).on("menu:activate selectmenu:load", ".js-select-menu",
    function() {
        var t;
        return t = $(this).find(".js-select-menu-tab").first(),
        t.addClass("selected")
    }),
    $(document).on("click", ".js-select-menu .js-select-menu-tab",
    function() {
        var t;
        return t = $(this).closest(".js-select-menu"),
        t.find(".js-select-menu-tab").removeClass("selected"),
        $(this).addClass("selected"),
        !1
    }),
    t = function(t, e) {
        var n, s, i;
        i = t.getAttribute("data-tab-filter"),
        s = $(t).closest(".js-select-menu").find(".js-select-menu-tab-bucket"),
        n = s.filter(function() {
            return this.getAttribute("data-tab-filter") === i
        }),
        n.toggleClass("selected", e),
        e && n.fire("selectmenu:tabchange")
    },
    $.observe(".js-select-menu .js-select-menu-tab.selected", {
        add: function() {
            return t(this, !0)
        },
        remove: function() {
            return t(this, !1)
        }
    })
}.call(this),
function() {
    $(document).on("ajaxSuccess", ".js-social-container",
    function(t, e, n, s) {
        return $(this).find(".js-social-count").text(s.count)
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    n = [].slice;
    "undefined" != typeof EventSource && null !== EventSource && (navigator.userAgent.match(/iPhone/) || (t = function() {
        function t(t) {
            this.base = t,
            this.flush = e(this.flush, this),
            this.setup = e(this.setup, this),
            this.readyState = this.CONNECTING,
            this.listeners = {},
            setImmediate(this.setup)
        }
        return t.prototype.CONNECTING = 0,
        t.prototype.OPEN = 1,
        t.prototype.CLOSED = 2,
        t.prototype.setup = function() {
            var t, e; (e = this.popMessages()) && (t = {
                message: e
            }),
            $.ajax({
                type: "POST",
                url: this.base,
                data: t,
                success: function(t) {
                    return function(e, n, s) {
                        var i;
                        return (i = s.getResponseHeader("Location")) ? (t.pollUrl = i, t.messageUrl = "" + t.pollUrl + "/message") : (t.pollUrl = e.pollUrl, t.messageUrl = e.messageUrl),
                        t.pollUrl ? (t.readyState = t.OPEN, t.fire("open"), t.readyState === t.OPEN ? (t.flush(), t.start()) : void 0) : t.close()
                    }
                } (this),
                error: function(t) {
                    return function() {
                        return t.close()
                    }
                } (this)
            })
        },
        t.prototype.start = function() {
            this.source = new EventSource(this.pollUrl),
            this.source.addEventListener("message",
            function(t) {
                return function(e) {
                    var n;
                    n = JSON.parse(e.data),
                    t.fire("message", n)
                }
            } (this)),
            this.source.addEventListener("reopen",
            function(t) {
                return function() {
                    t.fire("reopen")
                }
            } (this)),
            this.source.addEventListener("error",
            function(t) {
                return function() {
                    t.source.readyState === EventSource.CLOSED && t.close()
                }
            } (this))
        },
        t.prototype.on = function(t, e) {
            var n;
            return null == (n = this.listeners)[t] && (n[t] = []),
            this.listeners[t].push(e),
            this
        },
        t.prototype.fire = function() {
            var t, e, s, i, r, a;
            if (i = arguments[0], t = 2 <= arguments.length ? n.call(arguments, 1) : [], s = this.listeners[i]) for (r = 0, a = s.length; a > r; r++) e = s[r],
            e.apply(this, t)
        },
        t.prototype.close = function() {
            var t;
            this.readyState = this.CLOSED,
            null != (t = this.source) && t.close(),
            this.source = null,
            this.pollUrl = null,
            this.messageUrl = null,
            this.fire("close")
        },
        t.prototype.send = function(t) {
            null == this.outbox && (this.outbox = []),
            this.outbox.push(t),
            this.fire("send", t),
            this.readyState === this.OPEN && null == this.flushTimeout && (this.flushTimeout = setTimeout(this.flush, 0))
        },
        t.prototype.flush = function() {
            var t;
            this.messageUrl && (this.flushTimeout = null, (t = this.popMessages()) && $.ajax({
                type: "POST",
                url: this.messageUrl,
                data: {
                    message: t
                },
                error: function(t) {
                    return function() {
                        return t.close()
                    }
                } (this)
            }))
        },
        t.prototype.popMessages = function() {
            var t;
            if (this.outbox) return t = this.outbox,
            this.outbox = null,
            t
        },
        t
    } (), $.socket = function(e) {
        return new t(e)
    }))
}.call(this),
function() {
    $.socket && ($.fn.socket = function() {
        var t, e;
        if ((t = this[0]) && $(t).is("link[rel=xhr-socket]")) return e = $(t).data("socket"),
        e && e.readyState !== e.CLOSED ? e: (e = $.socket(t.href), e.on("open",
        function() {
            return $(t).trigger("socket:open", [this])
        }), e.on("close",
        function() {
            return $(t).trigger("socket:close", [this])
        }), e.on("reopen",
        function() {
            return $(t).trigger("socket:reopen", [this])
        }), e.on("send",
        function(e) {
            return $(t).trigger("socket:send", [e, this])
        }), e.on("message",
        function(e) {
            return $(t).trigger("socket:message", [e, this])
        }), $(t).data("socket", e), e)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a;
    $.fn.socket && (i = {},
    t = {},
    a = null, n = function() {
        var t;
        return null != a ? a: a = (t = $(document.head).find("link[rel=xhr-socket]")[0]) ? $(t).socket() : !1
    },
    e = function(t) {
        var e, n;
        return null != (e = null != (n = t.getAttribute("data-channel")) ? n.split(/\s+/) : void 0) ? e: []
    },
    s = function(s) {
        var r, a, o, c, l;
        if (a = n()) for (l = e(s), o = 0, c = l.length; c > o; o++) r = l[o],
        i[r] || (a.send({
            subscribe: r
        }), i[r] = !0),
        null == t[r] && (t[r] = []),
        t[r].push(s)
    },
    r = function(n) {
        var s, i, r, a;
        for (a = e(n), i = 0, r = a.length; r > i; i++) s = a[i],
        t[s] = $(t[s]).not(n).slice(0)
    },
    $(document).on("socket:reopen", "link[rel=xhr-socket]",
    function(t, e) {
        var n, s;
        for (n in i) s = i[n],
        e.send({
            subscribe: n
        })
    }), $(document).on("socket:message", "link[rel=xhr-socket]",
    function(e, n) {
        var s, i;
        i = n[0],
        s = n[1],
        i && s && $(t[i]).trigger("socket:message", [s, i])
    }), $.observe(".js-socket-channel[data-channel]", {
        add: s,
        remove: r
    }))
}.call(this),
function() {
    $.fn.socket && $(document).on("visibilitychange webkitvisibilitychange mozvisibilitychange msvisibilitychange",
    function() {
        var t; (t = $(document.head).find("link[rel=xhr-socket]").data("socket")) && (document.hidden || document.webkitHidden || document.mozHidden || document.msHidden ? t.send({
            visibility: "hidden"
        }) : t.send({
            visibility: "visible"
        }))
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t() {
            this.onMouseMove = e(this.onMouseMove, this),
            this.onMouseUp = e(this.onMouseUp, this),
            this.onMouseDown = e(this.onMouseDown, this),
            $(document).on("mousedown", ".js-sortable-container .js-sortable-target", this.onMouseDown)
        }
        var n;
        return n = $("<li />").addClass("js-sortable-placeholder sortable-placeholder"),
        t.prototype.onMouseDown = function(t) {
            return $(t.currentTarget).addClass("js-sorting").fadeTo(0, .5).css({
                "z-index": 10,
                position: "absolute",
                top: $(t.currentTarget).position().top,
                left: $(t.currentTarget).position().left
            }).after(n),
            $(document).on("mousemove.sortable", this.onMouseMove),
            $(document).on("mouseup", this.onMouseUp),
            !1
        },
        t.prototype.onMouseUp = function() {
            return $(".js-sorting").removeClass("js-sorting").fadeTo(0, 1).css({
                "z-index": "",
                position: "",
                top: "",
                left: ""
            }),
            $(".js-sortable-placeholder").remove(),
            $(document).off("mousemove.sortable", this.onMouseMove),
            $(document).off("mouseup", this.onMouseUp),
            !1
        },
        t.prototype.onMouseMove = function(t) {
            var e, n, s;
            return e = $(".js-sorting"),
            s = t.pageY - e.parent().offset().top,
            n = $(".js-sorting").height(),
            0 + n / 2 > s ? $(".js-sorting").css({
                top: 0
            }) : s > e.parent().height() - n / 2 ? $(".js-sorting").css({
                top: e.parent().height() - e.height()
            }) : $(".js-sorting").css({
                top: s - n / 2
            }),
            $(".js-sorting").index() < e.parent().find(".js-sortable-target").length && $(".js-sorting").index() >= 0 && ($(".js-sorting").position().top > $(".js-sortable-placeholder").position().top + .8 * n ? ($(".js-sortable-placeholder").insertAfter($(".js-sortable-placeholder").next()), $(".js-sorting").insertBefore($(".js-sortable-placeholder"))) : $(".js-sorting").position().top < $(".js-sortable-placeholder").position().top - .8 * n && ($(".js-sortable-placeholder").insertBefore($(".js-sortable-placeholder").prev().prev()), $(".js-sorting").insertBefore($(".js-sortable-placeholder")))),
            !1
        },
        t
    } (),
    new t
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t(t) {
            var n;
            this.textarea = t,
            this.deactivate = e(this.deactivate, this),
            this.onNavigationOpen = e(this.onNavigationOpen, this),
            this.onNavigationKeyDown = e(this.onNavigationKeyDown, this),
            this.onKeyUp = e(this.onKeyUp, this),
            this.teardown = e(this.teardown, this),
            $(this.textarea).on("focusout:delayed.suggester", this.teardown),
            $(this.textarea.form).on("reset.suggester", this.deactivate),
            $(this.textarea).on("keyup.suggester", this.onKeyUp),
            this.suggester = (n = $(this.textarea).attr("data-suggester")) ? document.getElementById(n) : $(this.textarea).closest(".js-suggester-container").find(".js-suggester")[0],
            $(this.suggester).on("navigation:keydown.suggester", "[data-value]", this.onNavigationKeyDown),
            $(this.suggester).on("navigation:open.suggester", "[data-value]", this.onNavigationOpen),
            this.loadSuggestions()
        }
        var n, s;
        return t.prototype.types = {
            mention: {
                match: /(^|\s)(@([a-z0-9\-_\/]*))$/i,
                replace: "$1@$value ",
                search: function(t, e) {
                    var n, s;
                    return n = $(t).find("ul.mention-suggestions"),
                    s = n.fuzzyFilterSortList(e, {
                        limit: 5
                    }),
                    Promise.resolve([n, s])
                }
            },
            emoji: {
                match: /(^|\s)(:([a-z0-9\-\+_]*))$/i,
                replace: "$1:$value: ",
                search: function(t, e) {
                    var n, s;
                    return n = $(t).find("ul.emoji-suggestions"),
                    s = n.prefixFilterList(e, {
                        limit: 5
                    }),
                    Promise.resolve([n, s])
                }
            },
            hashed: {
                match: /(^|\s)(\#([a-z0-9\-_\/]*))$/i,
                replace: "$1#$value ",
                search: function(t, e) {
                    var n, s;
                    return n = $(t).find("ul.hashed-suggestions"),
                    s = n.fuzzyFilterSortList("#" + e, {
                        limit: 5
                    }),
                    Promise.resolve([n, s])
                }
            }
        },
        s = function(t) {
            return t.replace(/`{3,}[^`]*\n(.+)?\n`{3,}/g, "")
        },
        n = function(t) {
            var e, n;
            return (null != (e = t.match(/`{3,}/g)) ? e.length: void 0) % 2 ? !0 : (null != (n = s(t).match(/`/g)) ? n.length: void 0) % 2 ? !0 : void 0
        },
        t.prototype.teardown = function() {
            this.deactivate(),
            $(this.textarea).off(".suggester"),
            $(this.textarea.form).on(".suggester"),
            $(this.suggester).off(".suggester")
        },
        t.prototype.onKeyUp = function() {
            return this.checkQuery() ? !1 : void 0
        },
        t.prototype.onNavigationKeyDown = function(t) {
            switch (t.hotkey) {
            case "tab":
                return this.onNavigationOpen(t),
                !1;
            case "esc":
                return this.deactivate(),
                !1
            }
        },
        t.prototype.onNavigationOpen = function(t) {
            var e, n, s;
            return s = $(t.target).attr("data-value"),
            n = this.textarea.value.substring(0, this.currentSearch.endIndex),
            e = this.textarea.value.substring(this.currentSearch.endIndex),
            n = n.replace(this.currentSearch.type.match, this.currentSearch.type.replace.replace("$value", s)),
            this.textarea.value = n + e,
            this.deactivate(),
            this.textarea.focus(),
            this.textarea.selectionStart = n.length,
            this.textarea.selectionEnd = n.length,
            !1
        },
        t.prototype.checkQuery = function() {
            var t, e;
            if (t = this.searchQuery()) {
                if (t.query === (null != (e = this.currentSearch) ? e.query: void 0)) return;
                return this.currentSearch = t,
                this.search(t.type, t.query).then(function(e) {
                    return function(n) {
                        return n ? e.activate(t.startIndex) : e.deactivate()
                    }
                } (this)),
                this.currentSearch.query
            }
            this.currentSearch = null,
            this.deactivate()
        },
        t.prototype.activate = function(t) {
            var e;
            $(this.suggester).hasClass("active") || ($(this.suggester).addClass("active"), e = $(this.textarea).textareaMirror(t + 1), t = $(e).find(".js-marker").position(), $(this.suggester).css(t), $(this.textarea).addClass("js-navigation-enable"), $(this.suggester).navigation("push"), $(this.suggester).navigation("focus"))
        },
        t.prototype.deactivate = function() {
            $(this.suggester).hasClass("active") && ($(this.suggester).removeClass("active"), $(this.suggester).find(".suggestions").hide(), $(this.textarea).removeClass("js-navigation-enable"), $(this.suggester).navigation("pop"))
        },
        t.prototype.search = function(t, e) {
            return t.search(this.suggester, e).then(function(t) {
                return function(e) {
                    var n, s;
                    return n = e[0],
                    s = e[1],
                    s > 0 ? (n.show(), $(t.suggester).navigation("focus"), !0) : !1
                }
            } (this))
        },
        t.prototype.searchQuery = function() {
            var t, e, s, i, r, a;
            if (s = this.textarea.selectionEnd, i = this.textarea.value.substring(0, s), n(i)) return [];
            a = this.types;
            for (e in a) if (r = a[e], t = i.match(r.match)) return {
                type: r,
                text: t[2],
                query: t[3],
                startIndex: s - t[2].length,
                endIndex: s
            }
        },
        t.prototype.loadSuggestions = function() {
            return $(this.suggester).children().length ? void 0 : $.ajax({
                url: $(this.suggester).attr("data-url"),
                success: function(t) {
                    return function(e) {
                        return $(t.suggester).html(e),
                        t.currentSearch = null,
                        t.checkQuery()
                    }
                } (this)
            })
        },
        t
    } (),
    $(document).on("focusin:delayed", "textarea[data-suggester],.js-suggester-field",
    function() {
        new t(this)
    })
}.call(this),
function() {
    $(document).on("tasklist:change", ".js-task-list-container",
    function() {
        return $(this).addClass("is-updating-task-list").taskList("disable")
    }),
    $(document).on("tasklist:changed", ".js-task-list-container",
    function(t, e, n) {
        var s, i, r, a;
        return i = $(this).find("form.js-comment-update"),
        r = i.find("input[name=task_list_key]"),
        r.length > 0 || (a = i.find(".js-task-list-field").attr("name").split("[")[0], r = $("<input>", {
            type: "hidden",
            name: "task_list_key",
            value: a
        }), i.append(r)),
        s = $("<input>", {
            type: "hidden",
            name: "task_list_checked",
            value: null != n ? n: {
                1 : "0"
            }
        }),
        i.append(s),
        i.one("ajaxComplete",
        function() {
            return s.remove()
        }),
        i.submit()
    }),
    $(document).on("ajaxSuccess", ".js-task-list-container",
    function(t) {
        return $(t.target).is("form.js-comment-update") ? ($(this).removeClass("is-updating-task-list"), $(this).taskList("enable")) : void 0
    }),
    $.pageUpdate(function() {
        return $(this).find(".js-task-list-container:not(.is-updating-task-list)").taskList("enable")
    })
}.call(this),
function() {
    $(document).on("ajaxBeforeSend",
    function(t, e, n) {
        var s;
        n.crossDomain || (s = document.getElementById("js-timeline-marker")) && e.setRequestHeader("X-Timeline-Last-Modified", $(s).attr("data-last-modified"))
    })
}.call(this),
function(t) {
    var e = function() {
        "use strict";
        var t = "s",
        n = function(t) {
            var e = -t.getTimezoneOffset();
            return null !== e ? e: 0
        },
        s = function(t, e, n) {
            var s = new Date;
            return void 0 !== t && s.setFullYear(t),
            s.setMonth(e),
            s.setDate(n),
            s
        },
        i = function(t) {
            return n(s(t, 0, 2))
        },
        r = function(t) {
            return n(s(t, 5, 2))
        },
        a = function(t) {
            var e = t.getMonth() > 7,
            s = e ? r(t.getFullYear()) : i(t.getFullYear()),
            a = n(t),
            o = 0 > s,
            c = s - a;
            return o || e ? 0 !== c: 0 > c
        },
        o = function() {
            var e = i(),
            n = r(),
            s = e - n;
            return 0 > s ? e + ",1": s > 0 ? n + ",1," + t: e + ",0"
        },
        c = function() {
            var t = o();
            return new e.TimeZone(e.olson.timezones[t])
        },
        l = function(t) {
            var e = new Date(2010, 6, 15, 1, 0, 0, 0),
            n = {
                "America/Denver": new Date(2011, 2, 13, 3, 0, 0, 0),
                "America/Mazatlan": new Date(2011, 3, 3, 3, 0, 0, 0),
                "America/Chicago": new Date(2011, 2, 13, 3, 0, 0, 0),
                "America/Mexico_City": new Date(2011, 3, 3, 3, 0, 0, 0),
                "America/Asuncion": new Date(2012, 9, 7, 3, 0, 0, 0),
                "America/Santiago": new Date(2012, 9, 3, 3, 0, 0, 0),
                "America/Campo_Grande": new Date(2012, 9, 21, 5, 0, 0, 0),
                "America/Montevideo": new Date(2011, 9, 2, 3, 0, 0, 0),
                "America/Sao_Paulo": new Date(2011, 9, 16, 5, 0, 0, 0),
                "America/Los_Angeles": new Date(2011, 2, 13, 8, 0, 0, 0),
                "America/Santa_Isabel": new Date(2011, 3, 5, 8, 0, 0, 0),
                "America/Havana": new Date(2012, 2, 10, 2, 0, 0, 0),
                "America/New_York": new Date(2012, 2, 10, 7, 0, 0, 0),
                "Europe/Helsinki": new Date(2013, 2, 31, 5, 0, 0, 0),
                "Pacific/Auckland": new Date(2011, 8, 26, 7, 0, 0, 0),
                "America/Halifax": new Date(2011, 2, 13, 6, 0, 0, 0),
                "America/Goose_Bay": new Date(2011, 2, 13, 2, 1, 0, 0),
                "America/Miquelon": new Date(2011, 2, 13, 5, 0, 0, 0),
                "America/Godthab": new Date(2011, 2, 27, 1, 0, 0, 0),
                "Europe/Moscow": e,
                "Asia/Amman": new Date(2013, 2, 29, 1, 0, 0, 0),
                "Asia/Beirut": new Date(2013, 2, 31, 2, 0, 0, 0),
                "Asia/Damascus": new Date(2013, 3, 6, 2, 0, 0, 0),
                "Asia/Jerusalem": new Date(2013, 2, 29, 5, 0, 0, 0),
                "Asia/Yekaterinburg": e,
                "Asia/Omsk": e,
                "Asia/Krasnoyarsk": e,
                "Asia/Irkutsk": e,
                "Asia/Yakutsk": e,
                "Asia/Vladivostok": e,
                "Asia/Baku": new Date(2013, 2, 31, 4, 0, 0),
                "Asia/Yerevan": new Date(2013, 2, 31, 3, 0, 0),
                "Asia/Kamchatka": e,
                "Asia/Gaza": new Date(2010, 2, 27, 4, 0, 0),
                "Africa/Cairo": new Date(2010, 4, 1, 3, 0, 0),
                "Europe/Minsk": e,
                "Pacific/Apia": new Date(2010, 10, 1, 1, 0, 0, 0),
                "Pacific/Fiji": new Date(2010, 11, 1, 0, 0, 0),
                "Australia/Perth": new Date(2008, 10, 1, 1, 0, 0, 0)
            };
            return n[t]
        };
        return {
            determine: c,
            date_is_dst: a,
            dst_start_for: l
        }
    } ();
    e.TimeZone = function(t) {
        "use strict";
        var n = {
            "America/Denver": ["America/Denver", "America/Mazatlan"],
            "America/Chicago": ["America/Chicago", "America/Mexico_City"],
            "America/Santiago": ["America/Santiago", "America/Asuncion", "America/Campo_Grande"],
            "America/Montevideo": ["America/Montevideo", "America/Sao_Paulo"],
            "Asia/Beirut": ["Asia/Amman", "Asia/Jerusalem", "Asia/Beirut", "Europe/Helsinki", "Asia/Damascus"],
            "Pacific/Auckland": ["Pacific/Auckland", "Pacific/Fiji"],
            "America/Los_Angeles": ["America/Los_Angeles", "America/Santa_Isabel"],
            "America/New_York": ["America/Havana", "America/New_York"],
            "America/Halifax": ["America/Goose_Bay", "America/Halifax"],
            "America/Godthab": ["America/Miquelon", "America/Godthab"],
            "Asia/Dubai": ["Europe/Moscow"],
            "Asia/Dhaka": ["Asia/Yekaterinburg"],
            "Asia/Jakarta": ["Asia/Omsk"],
            "Asia/Shanghai": ["Asia/Krasnoyarsk", "Australia/Perth"],
            "Asia/Tokyo": ["Asia/Irkutsk"],
            "Australia/Brisbane": ["Asia/Yakutsk"],
            "Pacific/Noumea": ["Asia/Vladivostok"],
            "Pacific/Tarawa": ["Asia/Kamchatka", "Pacific/Fiji"],
            "Pacific/Tongatapu": ["Pacific/Apia"],
            "Asia/Baghdad": ["Europe/Minsk"],
            "Asia/Baku": ["Asia/Yerevan", "Asia/Baku"],
            "Africa/Johannesburg": ["Asia/Gaza", "Africa/Cairo"]
        },
        s = t,
        i = function() {
            for (var t = n[s], i = t.length, r = 0, a = t[0]; i > r; r += 1) if (a = t[r], e.date_is_dst(e.dst_start_for(a))) return s = a,
            void 0
        },
        r = function() {
            return "undefined" != typeof n[s]
        };
        return r() && i(),
        {
            name: function() {
                return s
            }
        }
    },
    e.olson = {},
    e.olson.timezones = {
        "-720,0": "Pacific/Majuro",
        "-660,0": "Pacific/Pago_Pago",
        "-600,1": "America/Adak",
        "-600,0": "Pacific/Honolulu",
        "-570,0": "Pacific/Marquesas",
        "-540,0": "Pacific/Gambier",
        "-540,1": "America/Anchorage",
        "-480,1": "America/Los_Angeles",
        "-480,0": "Pacific/Pitcairn",
        "-420,0": "America/Phoenix",
        "-420,1": "America/Denver",
        "-360,0": "America/Guatemala",
        "-360,1": "America/Chicago",
        "-360,1,s": "Pacific/Easter",
        "-300,0": "America/Bogota",
        "-300,1": "America/New_York",
        "-270,0": "America/Caracas",
        "-240,1": "America/Halifax",
        "-240,0": "America/Santo_Domingo",
        "-240,1,s": "America/Santiago",
        "-210,1": "America/St_Johns",
        "-180,1": "America/Godthab",
        "-180,0": "America/Argentina/Buenos_Aires",
        "-180,1,s": "America/Montevideo",
        "-120,0": "America/Noronha",
        "-120,1": "America/Noronha",
        "-60,1": "Atlantic/Azores",
        "-60,0": "Atlantic/Cape_Verde",
        "0,0": "UTC",
        "0,1": "Europe/London",
        "60,1": "Europe/Berlin",
        "60,0": "Africa/Lagos",
        "60,1,s": "Africa/Windhoek",
        "120,1": "Asia/Beirut",
        "120,0": "Africa/Johannesburg",
        "180,0": "Asia/Baghdad",
        "180,1": "Europe/Moscow",
        "210,1": "Asia/Tehran",
        "240,0": "Asia/Dubai",
        "240,1": "Asia/Baku",
        "270,0": "Asia/Kabul",
        "300,1": "Asia/Yekaterinburg",
        "300,0": "Asia/Karachi",
        "330,0": "Asia/Kolkata",
        "345,0": "Asia/Kathmandu",
        "360,0": "Asia/Dhaka",
        "360,1": "Asia/Omsk",
        "390,0": "Asia/Rangoon",
        "420,1": "Asia/Krasnoyarsk",
        "420,0": "Asia/Jakarta",
        "480,0": "Asia/Shanghai",
        "480,1": "Asia/Irkutsk",
        "525,0": "Australia/Eucla",
        "525,1,s": "Australia/Eucla",
        "540,1": "Asia/Yakutsk",
        "540,0": "Asia/Tokyo",
        "570,0": "Australia/Darwin",
        "570,1,s": "Australia/Adelaide",
        "600,0": "Australia/Brisbane",
        "600,1": "Asia/Vladivostok",
        "600,1,s": "Australia/Sydney",
        "630,1,s": "Australia/Lord_Howe",
        "660,1": "Asia/Kamchatka",
        "660,0": "Pacific/Noumea",
        "690,0": "Pacific/Norfolk",
        "720,1,s": "Pacific/Auckland",
        "720,0": "Pacific/Tarawa",
        "765,1,s": "Pacific/Chatham",
        "780,0": "Pacific/Tongatapu",
        "780,1,s": "Pacific/Apia",
        "840,0": "Pacific/Kiritimati"
    },
    "undefined" != typeof exports ? exports.jstz = e: t.jstz = e
} (this),
function() {
    var t, e;
    e = jstz.determine().name(),
    "https:" === location.protocol && (t = "secure"),
    document.cookie = "tz=" + encodeURIComponent(e) + "; path=/; " + t
}.call(this),
function() {
    var t, e;
    e = function() {
        if (!window.performance.timing) try {
            return window.sessionStorage.setItem("navigationStart", Date.now())
        } catch(t) {}
    },
    t = function() {
        return setTimeout(function() {
            var t, e, n, s, i, r, a, o;
            if (s = {},
            s.crossBrowserLoadEvent = Date.now(), window.performance.timing) {
                r = window.performance.timing;
                for (e in r) i = r[e],
                "number" == typeof i && (s[e] = i); (t = null != (a = window.chrome) ? "function" == typeof a.loadTimes ? null != (o = a.loadTimes()) ? o.firstPaintTime: void 0 : void 0 : void 0) && (s.chromeFirstPaintTime = Math.round(1e3 * t))
            } else n = window.sessionStorage.getItem("navigationStart"),
            n && (s.simulatedNavigationStart = n);
            return Object.keys(s).length > 1 ? $.ajax({
                url: "/_stats",
                type: "POST",
                data: {
                    timing: s
                }
            }) : void 0
        },
        0)
    },
    $(window).on("pagehide", e),
    $(window).on("load", t)
}.call(this),
function() {
    var t;
    t = function() {
        var t;
        return t = $(this),
        t.hasClass("downwards") || t.hasClass("tooltipped-s") ? "n": t.hasClass("tooltipped-se") ? "nw": t.hasClass("tooltipped-sw") ? "ne": t.hasClass("rightwards") || t.hasClass("tooltipped-e") ? "w": t.hasClass("leftwards") || t.hasClass("tooltipped-w") ? "e": t.hasClass("tooltipped-nw") ? "se": t.hasClass("tooltipped-ne") ? "sw": "s"
    },
    $(".tipsy-tooltips").length && $.observe(".tooltipped", {
        init: function() {
            $(this).tipsy({
                gravity: t
            })
        },
        add: function() {
            return $(this).tipsy({
                gravity: t
            })
        },
        remove: function() {
            return $(this).tipsy("disable"),
            $.fn.tipsy.revalidate()
        }
    }),
    $(document).on("menu:activated",
    function() {
        return $(this).find(".js-menu-target.tooltipped").tipsy("hide"),
        !0
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t() {
            this.onToggle = e(this.onToggle, this),
            this.onError = e(this.onError, this),
            this.onSuccess = e(this.onSuccess, this),
            this.onComplete = e(this.onComplete, this),
            this.onBeforeSend = e(this.onBeforeSend, this),
            this.onClick = e(this.onClick, this),
            $(document).on("click", ".js-toggler-container .js-toggler-target", this.onClick),
            $(document).on("ajaxBeforeSend", ".js-toggler-container", this.onBeforeSend),
            $(document).on("ajaxComplete", ".js-toggler-container", this.onComplete),
            $(document).on("ajaxSuccess", ".js-toggler-container", this.onSuccess),
            $(document).on("ajaxError", ".js-toggler-container", this.onError),
            $(document).on("toggler:toggle", ".js-toggler-container", this.onToggle)
        }
        return t.prototype.onClick = function(t) {
            return $(t.target).trigger("toggler:toggle"),
            !1
        },
        t.prototype.onBeforeSend = function(t) {
            var e;
            return e = t.currentTarget,
            $(e).removeClass("success error"),
            $(e).addClass("loading")
        },
        t.prototype.onComplete = function(t) {
            return $(t.currentTarget).removeClass("loading")
        },
        t.prototype.onSuccess = function(t) {
            return $(t.currentTarget).addClass("success")
        },
        t.prototype.onError = function(t) {
            return $(t.currentTarget).addClass("error")
        },
        t.prototype.onToggle = function(t) {
            var e;
            return e = t.currentTarget,
            $(e).toggleClass("on")
        },
        t
    } (),
    new t
}.call(this),
function() {
    var t;
    t = function(t, e, n) {
        var s, i;
        return null == n && (n = !0),
        i = $.Deferred(),
        s = $(t),
        $.preserveInteractivePosition(function() {
            n && s.hasInteractions() ? i.rejectWith(s) : i.resolveWith(s.replaceContent(e))
        }),
        i.promise()
    },
    $.fn.updateContent = function(e, n) {
        var s, i;
        return null == n && (n = {}),
        (s = this.data("update-content")) ? s: (e ? (null != (i = this.data("xhr")) && i.abort(), s = t(this, e, !1)) : s = this.ajax({
            channel: n.channel
        }).then(function(e) {
            return t(this, e, !0)
        }), this.data("update-content", s), s.always(function() {
            return $(this).removeData("update-content")
        }), s)
    },
    $(document).on("socket:message", ".js-updatable-content",
    function(t, e, n) {
        this === t.target && $(this).updateContent(null, {
            channel: n
        })
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v, y, b, j, w, x, C, k, S, _, T, D, M, P, A, B, L, E = [].indexOf ||
    function(t) {
        for (var e = 0,
        n = this.length; n > e; e++) if (e in this && this[e] === t) return e;
        return - 1
    },
    F = {}.hasOwnProperty,
    I = function(t, e) {
        function n() {
            this.constructor = t
        }
        for (var s in e) F.call(e, s) && (t[s] = e[s]);
        return n.prototype = e.prototype,
        t.prototype = new n,
        t.__super__ = e.prototype,
        t
    };
    r = function() {
        function t() {
            this.uploads = [],
            this.busy = !1
        }
        return t.prototype.upload = function(t, e) {
            var n, s, i, r;
            return r = e.start ||
            function() {},
            i = e.progress ||
            function() {},
            n = e.complete ||
            function() {},
            s = e.error ||
            function() {},
            this.uploads.push({
                file: t,
                to: e.to,
                form: e.form || {},
                start: r,
                progress: i,
                complete: n,
                error: s
            }),
            this.process()
        },
        t.prototype.process = function() {
            var t, e, n, s, i, r;
            if (!this.busy && 0 !== this.uploads.length) {
                n = this.uploads.shift(),
                this.busy = !0,
                i = new XMLHttpRequest,
                i.open("POST", n.to, !0),
                i.setRequestHeader("X-CSRF-Token", this.token()),
                i.onloadstart = function() {
                    return function() {
                        return n.start()
                    }
                } (this),
                i.onreadystatechange = function(t) {
                    return function() {
                        var e;
                        return 4 === i.readyState ? (204 === i.status ? (e = i.getResponseHeader("Location"), n.complete({
                            href: e
                        })) : 201 === i.status ? n.complete(JSON.parse(i.responseText)) : n.error(), t.busy = !1, t.process()) : void 0
                    }
                } (this),
                i.onerror = function() {
                    return function() {
                        return n.error()
                    }
                } (this),
                i.upload.onprogress = function(t) {
                    var e;
                    return t.lengthComputable ? (e = Math.round(100 * (t.loaded / t.total)), n.progress(e)) : void 0
                },
                t = new FormData,
                r = n.form;
                for (e in r) s = r[e],
                t.append(e, s);
                return t.append("file", n.file),
                i.send(t)
            }
        },
        t.prototype.token = function() {
            return $('meta[name="csrf-token"]').attr("content")
        },
        t
    } (),
    i = function() {
        function t(t) {
            this.container = t,
            this.model = $(t).data("model"),
            this.policyUrl = "/upload/policies/" + this.model
        }
        var e, n, s;
        return n = ["image/gif", "image/png", "image/jpeg"],
        e = ["gif", "png", "jpg", "jpeg"],
        t.prototype.available = function() {
            return this.field && null != this.field[0]
        },
        t.prototype.okToUpload = function(t) {
            return this.acceptableSize(t) && s(t.type)
        },
        t.prototype.acceptableSize = function(t) {
            return t.size < 10485760
        },
        t.prototype.setup = function(t) {
            return t()
        },
        t.prototype.start = function() {},
        t.prototype.progress = function() {},
        t.prototype.complete = function() {},
        t.prototype.error = function() {},
        t.prototype.acceptsExtension = function(t) {
            var n;
            return n = t.split(".").pop(),
            E.call(e, n) >= 0
        },
        s = function(t) {
            return E.call(n, t) >= 0
        },
        t
    } (),
    _ = [],
    s = function(t) {
        function e(t) {
            e.__super__.constructor.call(this, t),
            this.field = this.container.siblings("ul.js-releases-field"),
            this.li = this.field.find("li.js-template"),
            this.meter = this.container.find(".js-upload-meter")
        }
        var n, s, i;
        return I(e, t),
        e.prototype.setup = function(t) {
            return $("#release_id").val() ? t() : _.length > 0 ? _.push(t) : (_.push(t), $("button.js-save-draft").trigger("click", this.clearSetupQueue))
        },
        e.prototype.clearSetupQueue = function() {
            var t, e;
            for (e = []; t = _.pop();) e.push(t());
            return e
        },
        e.prototype.start = function() {
            return this.meter.show()
        },
        e.prototype.progress = function(t) {
            return this.meter.css("width", t + "%")
        },
        e.prototype.complete = function(t) {
            var e, n, s;
            return n = this.li.clone(),
            n.removeClass("template"),
            n.removeClass("js-template"),
            e = t.asset.name || t.asset.href.split("/").pop(),
            n.find(".filename").val(e),
            t.asset.size ? (s = (t.asset.size / 1048576).toFixed(2), n.find(".filesize").text("(" + s + "MB)")) : n.find(".filesize").text(""),
            n.find("input[type=hidden].url").val(t.asset.href),
            n.find("input[type=hidden].id").val(t.asset.id),
            this.field.append(n),
            this.field.removeClass("not-populated"),
            this.field.addClass("is-populated"),
            this.meter.hide()
        },
        e.prototype.okToUpload = function(t) {
            return this.acceptsExtension(t.name)
        },
        i = ["app"],
        e.prototype.acceptsExtension = function(t) {
            var e;
            return e = t.split(".").pop(),
            E.call(i, e) >= 0 ? (T(this.container), this.container.addClass("is-bad-file"), !1) : !0
        },
        n = function() {
            return ! 0
        },
        s = function() {
            return ! 0
        },
        e
    } (i),
    e = function(t) {
        function e(t) {
            e.__super__.constructor.call(this, t),
            this.field = this.container.find("img.js-image-field")
        }
        return I(e, t),
        e.prototype.complete = function(t) {
            return this.field.attr("src", t.asset.href),
            this.container.find("input.js-oauth-application-logo-id").val(t.asset.id),
            this.container.addClass("has-uploaded-logo")
        },
        e
    } (i),
    t = function(t) {
        function e(t) {
            e.__super__.constructor.call(this, t),
            this.field = this.container.find("img.js-avatar-field")
        }
        return I(e, t),
        e.prototype.acceptableSize = function(t) {
            return t.size < 1048576
        },
        e.prototype.complete = function(t) {
            return $.pjax({
                url: "/settings/avatars/" + t.uploadResult.id,
                container: "#site-container"
            })
        },
        e
    } (i),
    n = function(t) {
        function e(t) {
            e.__super__.constructor.call(this, t),
            this.field = this.container.find("textarea.js-comment-field")
        }
        var n, s, i, r;
        return I(e, t),
        s = function(t) {
            return t.toLowerCase().replace(/[^a-z0-9\-_]+/gi, ".").replace(/\.{2,}/g, ".").replace(/^\.|\.$/gi, "")
        },
        i = function(t) {
            return "![Uploading " + t + " . . .]()"
        },
        n = function(t) {
            return s(t).replace(/(.*)\.[^.]+$/, "$1").replace(/\./g, " ")
        },
        r = function(t, e, n) {
            var s, i;
            return $(t).data("link-replace") ? t.value = n: (s = t.value.substring(0, t.selectionEnd), i = t.value.substring(t.selectionEnd), s = s.replace(e, n), i = i.replace(e, n), t.value = s + i, t.selectionStart = s.length, t.selectionEnd = s.length)
        },
        e.prototype.start = function(t) {
            return p(this.field[0], i(t.name) + "\n")
        },
        e.prototype.complete = function(t) {
            var e, s;
            return s = i(t.asset.original_name),
            e = "![" + n(t.asset.name) + "](" + t.asset.href + ")",
            r(this.field[0], s, e)
        },
        e.prototype.error = function(t) {
            var e;
            return e = i(t.asset.original_name),
            r(this.field[0], e, "")
        },
        e
    } (i),
    k = ["is-default", "is-uploading", "is-bad-file", "is-too-big", "is-failed"],
    T = function(t) {
        return $(t).removeClass(k.join(" "))
    },
    D = function(t) {
        return T(t),
        $(t).addClass("is-default")
    },
    L = new r,
    l = [n, t, e, s],
    M = function(t) {
        var e, n, s, i;
        for (s = 0, i = l.length; i > s; s++) if (e = l[s], n = new e(t), n.available()) return n;
        return null
    },
    S = function(t, e) {
        var n;
        return n = M(e),
        n && n.okToUpload(t) ? n.setup(function() {
            return d(t, n.policyUrl, {
                success: function(e) {
                    var s;
                    return n.start(t),
                    s = h(e, n),
                    L.upload(t, s)
                },
                error: function(t) {
                    return T(e),
                    422 === t.status ? e.addClass(C(t.responseText)) : e.addClass("is-failed-request")
                }
            })
        }) : void 0
    },
    d = function(t, e, n) {
        return $.ajax({
            type: "POST",
            url: e,
            data: {
                name: t.name,
                size: t.size,
                content_type: t.type,
                organization_id: $("#alambic_organization").data("id"),
                repository_id: $("#release_repository_id").val(),
                release_id: $("#release_id").val(),
                team_id: $("[data-team-id]").data("team-id")
            },
            success: n.success,
            error: n.error
        })
    },
    C = function(t) {
        var e, n, s, i;
        n = "is-bad-file";
        try {
            e = JSON.parse(t),
            "size" === (null != e ? null != (s = e.errors) ? null != (i = s[0]) ? i.field: void 0 : void 0 : void 0) && (n = "is-too-big")
        } catch(r) {}
        return n
    },
    h = function(t, e) {
        var n, s;
        return n = $(e.container),
        s = {
            to: t.upload_url,
            form: t.form,
            start: function() {
                return T(n),
                n.addClass("is-uploading")
            },
            progress: function(t) {
                return e.progress(t)
            },
            complete: function(s) {
                var i;
                return (null != (i = t.asset_upload_url) ? i.length: void 0) > 0 && $.ajax({
                    type: "PUT",
                    url: t.asset_upload_url
                }),
                t.uploadResult = s,
                e.complete(t),
                e.field.trigger("change"),
                D(n)
            },
            error: function() {
                return e.error(t),
                e.field.trigger("change"),
                T(n),
                n.addClass("is-failed")
            }
        }
    },
    p = function(t, e) {
        var n, s, i, r;
        return i = t.selectionEnd,
        n = t.value.substring(0, i),
        r = t.value.substring(i),
        s = "" === t.value || n.match(/\n$/) ? "": "\n",
        t.value = n + s + e + r,
        t.selectionStart = i + e.length,
        t.selectionEnd = i + e.length
    },
    P = function(t) {
        var e, n, s, i;
        if (!t.types) return ! 1;
        for (i = t.types, n = 0, s = i.length; s > n; n++) if (e = i[n], "Files" === e) return ! 0;
        return ! 1
    },
    A = function(t) {
        var e, n, s, i;
        if (!t.types) return ! 1;
        for (i = t.types, n = 0, s = i.length; s > n; n++) if (e = i[n], "text/uri-list" === e) return ! 0;
        return ! 1
    },
    B = function(t) {
        var e, n, s, i;
        if (!t.types) return ! 1;
        for (i = t.types, n = 0, s = i.length; s > n; n++) if (e = i[n], "text/plain" === e) return ! 0;
        return ! 1
    },
    a = function(t, e) {
        var n, s, i, r, a, o;
        for (n = $(e), o = [], r = 0, a = t.length; a > r; r++) s = t[r],
        S(s, n) ? o.push(void 0) : (T(e), i = M(n), i.acceptableSize(s) ? o.push(n.addClass("is-bad-file")) : o.push(n.addClass("is-too-big")));
        return o
    },
    o = function(t, e) {
        var n, s, i, r, a, o, c;
        if (n = $(e), t && (i = M(n), i.available())) {
            for (o = t.split("\r\n"), c = [], r = 0, a = o.length; a > r; r++) s = o[r],
            i.acceptsExtension(s) ? (i.start({
                name: ""
            }), c.push(i.complete({
                asset: {
                    name: "",
                    href: s
                }
            }))) : (T(e), c.push(n.addClass("is-bad-file")));
            return c
        }
    },
    c = function(t, e) {
        var n;
        return n = $(e).find("textarea"),
        p(n[0], t)
    },
    f = function(t) {
        return P(t) ? "copy": A(t) ? "link": B(t) ? "copy": "none"
    },
    m = function(t) {
        switch (t) {
        case "image/gif":
            return "image.gif";
        case "image/png":
            return "image.png";
        case "image/jpeg":
            return "image.jpg"
        }
    },
    y = function(t) {
        return t.preventDefault()
    },
    v = function(t) {
        return t.dataTransfer.dropEffect = "none",
        t.preventDefault()
    },
    b = function(t) {
        var e;
        return e = f(t.dataTransfer),
        t.dataTransfer.dropEffect = e,
        $(this).addClass("dragover"),
        t.stopPropagation(),
        t.preventDefault()
    },
    j = function(t) {
        return t.dataTransfer.dropEffect = "none",
        $(this).removeClass("dragover"),
        t.stopPropagation(),
        t.preventDefault()
    },
    w = function(t) {
        var e;
        return $(this).removeClass("dragover"),
        e = t.dataTransfer,
        e.types ? P(e) ? a(e.files, this) : A(e) ? o(e.getData("text/uri-list"), this) : B(e) && c(e.getData("text/plain"), this) : (T(this), $(this).addClass("is-bad-browser")),
        t.stopPropagation(),
        t.preventDefault()
    },
    x = function(t) {
        var e, n, s, i, r;
        if ((s = null != (i = t.clipboardData) ? null != (r = i.items) ? r[0] : void 0 : void 0) && (n = m(s.type))) return e = s.getAsFile(),
        e.name = n,
        a([e], this),
        t.preventDefault()
    },
    g = function(t) {
        return $(t.target).hasClass("js-manual-file-chooser") ? t.target.files ? a(t.target.files, this) : (T(this), $(this).addClass("is-bad-browser")) : void 0
    },
    u = 0,
    $.observe(".js-uploadable-container", {
        add: function() {
            return 0 === u++&&(document.addEventListener("drop", y), document.addEventListener("dragover", v)),
            this.addEventListener("dragenter", b),
            this.addEventListener("dragover", b),
            this.addEventListener("dragleave", j),
            this.addEventListener("drop", w),
            this.addEventListener("paste", x),
            this.addEventListener("change", g)
        },
        remove: function() {
            return 0 === --u && (document.removeEventListener("drop", y), document.removeEventListener("dragover", v)),
            this.removeEventListener("dragenter", b),
            this.removeEventListener("dragover", b),
            this.removeEventListener("dragleave", j),
            this.removeEventListener("drop", w),
            this.removeEventListener("paste", x),
            this.removeEventListener("change", g)
        }
    }),
    ("undefined" == typeof FormData || null === FormData) && $(document.documentElement).addClass("no-dnd-uploads")
}.call(this),
function() {
    var t, e;
    t = function(e) {
        var n, s, i, r, a;
        if (n = $(e), n.is("form")) {
            for (a = e.elements, i = 0, r = a.length; r > i; i++) if (s = a[i], !t(s)) return ! 1;
            return ! 0
        }
        return n.is("input[required], textarea[required]") && "" === $.trim(n.val()) ? !1 : !0
    },
    e = function() {
        var e;
        return e = t(this),
        e && $(this).trigger("validation:field:change"),
        function() {
            var n;
            n = t(this),
            n !== e && $(this).trigger("validation:field:change"),
            e = n
        }
    },
    $(document).onFocusedInput("input[required], textarea[required]", e),
    $(document).on("change", "input[required], textarea[required]", e),
    $(document).on("validation:field:change", "form",
    function() {
        var e;
        return e = t(this),
        $(this).trigger("validation:change", [e])
    }),
    $(document).on("validation:change", "form",
    function(t, e) {
        return $(this).find("button[data-disable-invalid]").prop("disabled", !e)
    }),
    $(function() {
        var t, e, n, s;
        for (s = $("input[required], textarea[required]"), e = 0, n = s.length; n > e; e++) t = s[e],
        $(t).trigger("validation:field:change")
    })
}.call(this),
function() {
    $(document).on("ajaxSuccess",
    function(t, e) {
        var n; (n = e.getResponseHeader("X-XHR-Location")) && (document.location.href = n, t.stopImmediatePropagation())
    })
}.call(this),
("undefined" == typeof console || "undefined" == typeof console.log) && (window.console = {
    log: function() {}
}),
window.debug = function() {},
$.fn.spin = function() {
    return debug("$.fn.spin is DEPRECATED"),
    this.after('<img src="' + GitHub.Ajax.spinner + '" id="spinner" width="16" />')
},
$.fn.stopSpin = function() {
    return debug("$.fn.stopSpin is DEPRECATED"),
    $("#spinner").remove(),
    this
},
GitHub.Ajax = {
    spinner: GitHub.assetHostUrl + "images/spinners/octocat-spinner-32.gif",
    error: GitHub.assetHostUrl + "images/modules/ajax/error.png"
},
$(function() {
    var t = new Image;
    t.src = GitHub.Ajax.spinner,
    $(".js-form-signup-home input").placeholder()
}),
function() {
    $(document).on("hotkey:activate", ".js-employees-show-identicon",
    function() {
        return $(this).toggleClass("show-identicon")
    })
}.call(this),
function() {
    $(function() {
        var t, e;
        if (t = $("meta[name=octolytics-script-host]")[0]) return null == window._octo && (window._octo = []),
        _octo.push(["enablePerformance"]),
        _octo.push(["recordPageView"]),
        e = document.createElement("script"),
        e.type = "text/javascript",
        e.async = !0,
        e.src = "//" + t.content + "/assets/api.js",
        document.getElementsByTagName("head")[0].appendChild(e)
    })
}.call(this),
function() {
    var t;
    t = function() {
        function t() {}
        return $(".js-billing-section").data("contents", $(".js-billing-section").contents()),
        t.displayCreditCardFields = function(t) {
            var e, n;
            return e = $(".js-billing-section"),
            $("input[required]", e).each(function() {
                return $(this).addClass("js-required")
            }),
            n = $(".js-required", e),
            t ? (e.append(e.data("contents")), n.attr("required", !0)) : (e.contents().detach(), n.attr("required", !1))
        },
        t
    } (),
    window.Billing = t
}.call(this),
$(function() {
    $.hotkeys({
        y: function() {
            var t = $("link[rel='permalink']").attr("href");
            $("title"),
            t && (t += location.hash, window.location.href = t)
        }
    })
}),
function() {
    var t, e, n, s;
    e = function(e) {
        var n, i;
        return e.preventDefault(),
        n = t(e.target),
        i = n.find(".is-selected").index(),
        i + 1 === n.find(".js-carousel-slides .js-carousel-slide").length ? i = 0 : i++,
        s(n, i)
    },
    n = function(e) {
        var n, i;
        return e.preventDefault(),
        n = t(e.target),
        i = n.find(".is-selected").index(),
        0 === i ? i = $(n).find(".js-carousel-slides .js-carousel-slide").length - 1 : i--,
        s(n, i)
    },
    t = function(t) {
        return $(t).closest(".js-carousel")
    },
    s = function(t, e) {
        var n, s, i;
        return t ? (n = $(t).find(".is-selected"), i = n.outerWidth(), n.removeClass("is-selected").fire("carousel:unselected"), $(t).find(".js-carousel-slides").css("marginLeft", -1 * i * e), s = $(t).find(".js-carousel-slides .js-carousel-slide"), s.eq(e).addClass("is-selected").fire("carousel:selected")) : null
    },
    $(document).on("click", ".js-carousel .js-previous-slide", n),
    $(document).on("click", ".js-carousel .js-next-slide", e)
}.call(this),
function() {
    var t, e, n, s = [].slice,
    i = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    e = function(t) {
        return t.replace(/^\s+|\s+$/g, "")
    },
    n = function(t) {
        return t.replace(/^\s+/g, "")
    },
    t = function() {
        function t(t) {
            this.defaultContext = t,
            this.callbacks = {}
        }
        return t.prototype.bind = function(t, e) {
            var n, s, i, r, a;
            for (a = t.split(" "), i = 0, r = a.length; r > i; i++) n = a[i],
            (s = this.callbacks)[n] || (s[n] = []),
            this.callbacks[n].push(e);
            return this
        },
        t.getPageInfo = function() {
            var t, e;
            return e = $("#js-command-bar-field"),
            t = {},
            e.length ? (e.data("username") && (t.current_user = e.data("username")), t.search_choice = "global", $(".js-search-this-repository:checked").length && (t.search_choice = "this_repo"), e.data("repo") && (t.repo = {
                name_with_owner: e.data("repo"),
                branch: e.data("branch"),
                tree_sha: e.data("sha"),
                issues_page: !1
            },
            $(".js-issues-results").length && (t.repo.issues_page = !0)), t) : {}
        },
        t.prototype.trigger = function() {
            var t, e, n, i, r, a;
            if (i = arguments[0], t = 2 <= arguments.length ? s.call(arguments, 1) : [], n = this.callbacks[i], !n) return ! 0;
            for (r = 0, a = n.length; a > r; r++) if (e = n[r], e.apply(this.context, t) === !1) return ! 1;
            return ! 0
        },
        t.prototype.unbind = function(t, e) {
            var n, s, i, r, a;
            if (t) if (e) {
                for (n = this.callbacks[t], i = r = 0, a = n.length; a > r; i = ++r) if (s = n[i], s === e) {
                    n.splice(i, 1);
                    break
                }
            } else delete this.callbacks[t];
            else this.callbacks = {};
            return this
        },
        t.prototype.execute = function(t) {
            return new this.defaultContext(this, t).fullMatch().execute()
        },
        t.prototype.suggestions = function(t, e) {
            return new this.defaultContext(this, t).partialMatch().suggestions().slice(0, e)
        },
        t.prototype.complete = function(e, n) {
            var s;
            return s = new this.defaultContext(this, e).partialMatch(),
            t.Store.set("" + s.constructor.name + ":" + e, n),
            s.complete(n)
        },
        t
    } (),
    t.Store = function() {
        function t() {}
        var e;
        return e = function() {
            var t;
            try {
                return "localStorage" in window && null !== window.localStorage
            } catch(e) {
                return t = e,
                !1
            }
        },
        t.set = function(t, n) {
            var s;
            if (e()) try {
                return localStorage.setItem(t, JSON.stringify(n)),
                n
            } catch(i) {
                return s = i,
                !1
            }
        },
        t.get = function(t) {
            return e() ? this.parse(localStorage[t]) : null
        },
        t.parse = function(t) {
            var e;
            try {
                return JSON.parse(t)
            } catch(n) {
                return e = n,
                t
            }
        },
        t.expire = function(t) {
            var n;
            if (e()) return n = localStorage[t],
            localStorage.removeItem(t),
            n
        },
        t
    } (),
    t.RemoteProxy = function() {
        function t() {}
        return t.caches = {},
        t.requests = {},
        t.get = function(t, e, n) {
            var s;
            return this.commandBar = n,
            null == e.cache_for && (e.cache_for = 36e5),
            s = (new Date).getTime() - e.cache_for,
            this.shouldLoad = function(t) {
                return this.isCached(t) ? this.caches[t].requested < s ? !0 : !1 : !0
            },
            this.shouldLoad(t) ? (this.isLoading(t) || (this.requests[t] = $.ajax({
                url: t,
                dataType: e.dataType || "json",
                success: function(n) {
                    return function(s) {
                        return n.caches[t] = {
                            response: e.process(s),
                            requested: (new Date).getTime()
                        }
                    }
                } (this),
                error: function(e) {
                    return function() {
                        return e.caches[t] = {
                            response: [],
                            requested: (new Date).getTime()
                        }
                    }
                } (this),
                complete: function(e) {
                    return function() {
                        var n;
                        return delete e.requests[t],
                        null != (n = e.commandBar) ? n.trigger("suggest.commandbar") : void 0
                    }
                } (this)
            })), this.isCached(t) ? this.caches[t].response: [{
                command: "",
                description: e.loadingMessage,
                type: "loading"
            }]) : this.caches[t].response
        },
        t.isLoading = function(t) {
            return null != this.requests[t]
        },
        t.isCached = function(t) {
            return null != this.caches[t]
        },
        t
    } (),
    t.Timer = function() {
        function t() {
            this.time = (new Date).getTime()
        }
        return t.prototype.diff = function() {
            var t, e;
            return e = (new Date).getTime(),
            t = e - this.time,
            this.time = e,
            t
        },
        t
    } (),
    t.History = function() {
        function n() {}
        var s, i, r;
        return r = [],
        i = function() {
            return t.Store.set("commandbar.history", r.slice(0, 50).join("\n"))
        },
        s = function(t) {
            var n, s, i, a;
            for (s = [], i = 0, a = r.length; a > i; i++) n = r[i],
            e(n) !== e(t) && s.push(n);
            return r = s
        },
        n.load = function() {
            var e;
            return e = t.Store.get("commandbar.history"),
            r = null != e ? e.split("\n") : []
        },
        n.add = function(t) {
            return s(t),
            r.unshift(t),
            i()
        },
        n.get = function(t) {
            return r[t]
        },
        n.exists = function(t) {
            return null != r[t]
        },
        n
    } (),
    t.History.load(),
    t.Context = function() {
        function s(t, e, n) {
            this.commandBar = t,
            this.text = e,
            this.parent = n,
            this.lazyLoad = i(this.lazyLoad, this),
            this.suggestionCollection = i(this.suggestionCollection, this),
            this.matches = this.text.match(this.constructor.regex),
            this.remainder = this.matches ? this.text.replace(this.matches[0], "") : this.text
        }
        return s.contexts = [],
        s.register = function(t) {
            return this.contexts.push(t)
        },
        s.regex = new RegExp(""),
        s.matches = function(t) {
            return !! t.match(this.regex)
        },
        s.help = function() {
            return {}
        },
        s.prototype.override = function() {
            return ! 1
        },
        s.prototype.search = function() {
            return ! 1
        },
        s.prototype.suffix = function() {
            return " "
        },
        s.prototype.suggestionOptions = function() {
            return []
        },
        s.prototype.filter = function(n) {
            var s, i, r, a, o;
            for (r = e(this.remainder), s = [], a = 0, o = n.length; o > a; a++) i = n[a],
            i = t.SuggestionCollection.prepare(i),
            i.score = i.defaultScore || t.SuggestionCollection.score(i, r, this),
            0 !== i.score && s.push(i);
            return s.sort(function(t, e) {
                return e.score - t.score
            })
        },
        s.prototype.suggestionCollection = function() {
            var e, n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v;
            for (l = [], i = [], o = !1, c = 0, r = t.getPageInfo(), v = this.constructor.contexts, d = 0, m = v.length; m > d; d++) n = v[d],
            (!n.logged_in || r.current_user) && (e = new n(this.commandBar, this.remainder, this), u = e.suggestionOptions(), u = this.filter(u), 0 !== u.length && (e.override() && (o = !0), e.search() && c++, i.push({
                suggestions: u,
                override: e.override(),
                search: e.search()
            })));
            if (o) {
                for (a = [], h = 0, p = i.length; p > h; h++) s = i[h],
                (s.override || s.search) && a.push(s);
                i = a
            }
            for (f = 0, g = i.length; g > f; f++) s = i[f],
            l = l.concat(s.suggestions.slice(0, Math.round(6 / (i.length - c))));
            return l
        },
        s.prototype.suggestions = function() {
            var t;
            return t = this.suggestionCollection(),
            t.sort(function(t, e) {
                return e.score - t.score
            }),
            t
        },
        s.prototype.fullMatch = function(n) {
            var s, i, r, a, o, c, l, u;
            if (null == n && (n = this.remainder), i = this, r = t.getPageInfo(), "" === e(n)) o = this;
            else for (u = this.constructor.contexts, c = 0, l = u.length; l > c; c++) if (s = u[c], (!s.logged_in || r.current_user) && !s.skipMatch && s.matches(n) && (a = new s(this.commandBar, n, this).fullMatch())) return a;
            return o || i
        },
        s.prototype.partialMatch = function() {
            var e, s, i, r, a, o, c, l;
            if (s = this, i = t.getPageInfo(), this.remainder.length) {
                for (l = this.constructor.contexts, o = 0, c = l.length; c > o; o++) if (e = l[o], (!e.logged_in || i.current_user) && e.matches(this.remainder) && (r = new e(this.commandBar, n(this.remainder), this).partialMatch())) return r
            } else a = this.parent;
            return a || s
        },
        s.prototype.description = function() {
            return "Execute `" + this.command() + "`"
        },
        s.prototype.command = function() {
            return this.parent ? e("" + this.parent.command() + " " + this.matches[0]) : ""
        },
        s.prototype.complete = function(t) {
            var e;
            return e = this.fullMatch(t),
            (null != e ? e.command() : void 0) + e.suffix()
        },
        s.prototype.lazyLoad = function(e, n) {
            return t.RemoteProxy.get(e, n, this.commandBar)
        },
        s.prototype.loading = function(t) {
            return this.commandBar.trigger("loading.commandbar", t)
        },
        s.prototype.success = function(t) {
            return this.commandBar.trigger("success.commandbar", t)
        },
        s.prototype.error = function(t) {
            return this.commandBar.trigger("error.commandbar", t)
        },
        s.prototype.message = function(t) {
            return this.commandBar.trigger("message.commandbar", t)
        },
        s.prototype.goToUrl = function(e) {
            var n;
            return t.ctrlKey || t.metaKey ? (n = window.open(e, (new Date).getTime()), n !== window ? this.success("Opened in a new window") : void 0) : window.location = e
        },
        s.prototype.post = function(t) {
            return t = $.extend(t, {
                type: "POST"
            }),
            $.ajax(t)
        },
        s.prototype.execute = function() {},
        s
    } (),
    t.SuggestionCollection = {
        constructor: function(t) {
            this.suggestions = t
        },
        prepare: function(t) {
            return {
                prefix: t.prefix || "",
                url: t.url || null,
                search: t.search || null,
                command: t.command || "",
                display: t.display || t.command,
                description: t.description || "",
                type: t.type || "choice",
                multiplier: t.multiplier || 1,
                defaultScore: t.defaultScore || null,
                skip_fuzzy: t.skip_fuzzy || !1,
                filter: t.filter === !1 ? !1 : !0
            }
        },
        score: function(e, n, s) {
            var i, r, a;
            return r = 0,
            e.filter === !1 ? r = 1 : "loading" !== e.type ? (i = t.Store.get("" + s.constructor.name + ":" + n), i === e.command ? r = 1.99 : (a = e.search ? e.search: e.command, r = n ? $.fuzzyScore(a, n) : 1, r *= e.multiplier)) : r = 20,
            r
        }
    },
    window.CommandBar = t
}.call(this),
function() {
    var t, e, n;
    t = jQuery,
    e = {
        ENTER: 13,
        TAB: 9,
        UP: 38,
        DOWN: 40,
        N: 78,
        P: 80,
        CTRL: 17,
        ESC: 27
    },
    n = {
        init: function(n) {
            var s;
            return s = {
                classname: "commandbar",
                debug: !1,
                context: CommandBar.Context,
                limit: 12
            },
            s = t.extend(s, n),
            this.each(function() {
                var n, i, r, a, o, c, l, u, d, h, f, m, p, g, v, $, y;
                return o = new CommandBar(s.context),
                r = t(this),
                s.limit || (s.limit = r.attr("data-results-limit")),
                r.attr("autocomplete", "off"),
                r.attr("spellcheck", "false"),
                r.wrap('<div class="' + s.classname + '" />'),
                i = r.closest("." + s.classname),
                a = t('<span class="message" />').prependTo(i),
                n = t('<div class="display hidden" />').appendTo(i),
                f = null,
                l = 0,
                r.bind("execute.commandbar",
                function() {
                    return u()
                }),
                o.bind("suggest.commandbar",
                function() {
                    return r.trigger("suggest.commandbar")
                }),
                o.bind("loading.commandbar",
                function(t) {
                    return y(t, "loading")
                }),
                o.bind("message.commandbar",
                function(t) {
                    return g(t)
                }),
                o.bind("success.commandbar",
                function(t) {
                    return y("" + String.fromCharCode(10004) + " " + t, "success", !0)
                }),
                o.bind("error.commandbar",
                function(t) {
                    return y("" + String.fromCharCode(10006) + " " + t, "error", !0)
                }),
                o.bind("submit.commandbar",
                function() {
                    return r.closest("form").submit()
                }),
                y = function(t, e, n) {
                    return a.text(t).show().addClass("visible"),
                    a.removeClass("loading error success").addClass(e),
                    n ? d() : void 0
                },
                d = function() {
                    return setTimeout(function() {
                        return a.removeClass("visible")
                    },
                    5e3)
                },
                h = function() {
                    return a.hide().removeClass("visible loading error success")
                },
                v = function() {
                    var t, e, s;
                    return t = n.find(".selected"),
                    s = function() {
                        return t.position().top < 0
                    },
                    e = function() {
                        return t.position().top + t.outerHeight() > n.height()
                    },
                    s() && n.scrollTop(n.scrollTop() + t.position().top),
                    e() ? n.scrollTop(n.scrollTop() + t.position().top + t.outerHeight() - n.height()) : void 0
                },
                m = function() {
                    var t;
                    return n.find(".selected").removeClass("selected"),
                    -1 === l ? (r.val(r.data("val")), n.removeClass("hidden"), l++) : l >= 0 ? (t = n.find(".choice:nth-child(" + (l + 1) + ")").addClass("selected"), t.length ? (v(), r.val(o.complete(r.data("val"), t.data("command"))), l++) : n.find(".choice:nth-child(" + l + ")").addClass("selected")) : CommandBar.History.exists( - l - 2) ? (r.val(CommandBar.History.get( - l - 2)), l++) : void 0
                },
                p = function() {
                    var t;
                    return n.find(".selected").removeClass("selected"),
                    1 === l ? (r.val(r.data("val")), l--) : l > 1 ? (t = n.find(".choice:nth-child(" + (l - 1) + ")"), t.addClass("selected"), v(), t.length && r.val(o.complete(r.data("val"), t.data("command"))), l--) : CommandBar.History.exists( - l) ? (n.addClass("hidden"), r.val(CommandBar.History.get( - l)), l--) : void 0
                },
                c = function(e) {
                    var s, i;
                    return e.length || (e = n.find(".choice").first()),
                    e.length ? (null != f && clearTimeout(f), i = r.data("val"), s = t(e).data("command"), r.val(o.complete(i, s)), r.focus().keyup()) : void 0
                },
                g = function(t) {
                    return n.html(t).show().removeClass("hidden")
                },
                u = function() {
                    return n.html(""),
                    CommandBar.History.add(r.val()),
                    o.execute(r.val()),
                    r.val(""),
                    $()
                },
                a.click(function() {
                    return h(),
                    r.focus(),
                    !1
                }),
                r.focus(function() {
                    return clearTimeout(f),
                    i.addClass("focused"),
                    t(this).keyup()
                }),
                r.blur(function() {
                    return f = setTimeout(function() {
                        return i.removeClass("focused"),
                        n.addClass("hidden")
                    },
                    200)
                }),
                r.bind("suggest.commandbar",
                function() {
                    var e, i, r, a, c, u, d, h;
                    if (l = 0, u = t(this).val(), n.html(""), "" !== u) for (c = o.suggestions(u, s.limit), d = 0, h = c.length; h > d; d++) a = c[d],
                    i = t("<span class=command />"),
                    r = t("<span class=description />"),
                    e = t("<a class=" + a.type + "></a>").attr("data-command", a.command),
                    a.url && e.attr("href", a.url),
                    a.prefix && t("<span class=prefix />").html(a.prefix).appendTo(e),
                    a.display && i.text(a.display).appendTo(e),
                    a.description && r.text(a.description).appendTo(e),
                    e.appendTo(n),
                    a.skip_fuzzy || t.fuzzyHighlight(i[0], u),
                    a.skip_fuzzy || t.fuzzyHighlight(r[0], u);
                    return $()
                }),
                $ = function() {
                    return n.is(":empty") ? n.hide().addClass("hidden") : n.show().removeClass("hidden")
                },
                r.bind("throttled:input",
                function() {
                    return "" !== r.val() && h(),
                    r.data("val", r.val()),
                    r.trigger("suggest.commandbar")
                }),
                r.keyup(function(t) {
                    switch (t.which) {
                    case e.N:
                    case e.P:
                        return t.ctrlKey ? !1 : r.trigger("suggest.commandbar");
                    case e.ENTER:
                    case e.TAB:
                    case e.CTRL:
                    case e.DOWN:
                    case e.UP:
                    case e:
                        return ! 1;
                    case e.ESC:
                        return "" === r.val() ? r.blur() : r.val("")
                    }
                }),
                r.keydown(function(t) {
                    switch (CommandBar.ctrlKey = t.ctrlKey, CommandBar.metaKey = t.metaKey, CommandBar.shiftKey = t.shiftKey, t.which) {
                    case e.DOWN:
                        return m();
                    case e.UP:
                        return p(),
                        t.preventDefault(),
                        !1;
                    case e.P:
                        if (t.ctrlKey) return p();
                        break;
                    case e.N:
                        if (t.ctrlKey) return m();
                        break;
                    case e.ENTER:
                        return u(),
                        !1;
                    case e.TAB:
                        if ("" !== r.val()) return c(n.find(".selected")),
                        !1
                    }
                }),
                n.on("click", ".choice",
                function() {
                    var e;
                    return e = t(this),
                    e.attr("href") ? void 0 : (c(e), !1)
                })
            })
        }
    },
    t.fn.commandBar = function(e) {
        return n[e] ? n[e].apply(this, Array.prototype.slice.call(arguments, 1)) : "object" != typeof e && e ? t.error("Method " + e + " does not exists on jQuery.commandBar") : n.init.apply(this, arguments)
    }
}.call(this),
function() {
    $(document).on("hotkey:activate", "#js-command-bar-field",
    function(t) {
        switch (t.originalEvent.which) {
        case 191:
            return $(".js-this-repository-navigation-item").fire("navigation:open");
        case 83:
            return $(".js-all-repositories-navigation-item").fire("navigation:open")
        }
    }),
    $(document).on("focusout", "#js-command-bar-field",
    function() {
        return $(this).closest(".command-bar").removeClass("command-bar-focus")
    }),
    $(document).on("mousedown", ".commandbar .display",
    function() {
        return ! 1
    }),
    $(document).on("mousedown", ".command-bar-focus #advanced_search",
    function() {
        return ! 1
    }),
    $(document).on("click", ".js-command-bar .help",
    function() {
        var t;
        return t = $("#js-command-bar-field").focus(),
        setTimeout(function() {
            return t.val("help"),
            t.trigger("execute.commandbar")
        },
        250),
        !1
    }),
    $(document).focused("#js-command-bar-field")["in"](function() {
        var t;
        return t = $(this),
        t.data("command-bar-installed") ? t.closest(".command-bar").addClass("command-bar-focus") : (t.commandBar().data("command-bar-installed", !0), setTimeout(function() {
            return t.focus()
        },
        20))
    })
}.call(this),
function() {
    CommandBar.Context.prototype.execute = function() {
        return "" === $.trim(this.text) ? !1 : (this.loading("Searching for '" + this.text + "'"), this.commandBar.trigger("submit.commandbar"))
    }
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    n = {}.hasOwnProperty,
    s = function(t, e) {
        function s() {
            this.constructor = t
        }
        for (var i in e) n.call(e, i) && (t[i] = e[i]);
        return s.prototype = e.prototype,
        t.prototype = new s,
        t.__super__ = e.prototype,
        t
    };
    t = function(t) {
        function n() {
            return this.suffix = e(this.suffix, this),
            n.__super__.constructor.apply(this, arguments)
        }
        return s(n, t),
        n.contexts = [],
        n.regex = /^(help|\?)$/i,
        n.prototype.suggestionOptions = function() {
            return this.text.match(/^[h\?]/i) ? [{
                command: "help",
                description: "Show available commands",
                search: "help ?"
            }] : []
        },
        n.prototype.description = function() {
            return "Show available commands"
        },
        n.prototype.helpMessagesFor = function(t) {
            var e, n, s, i, r, a, o;
            for (r = this, i = [], s = CommandBar.getPageInfo(), a = 0, o = t.length; o > a; a++) e = t[a],
            (!e.logged_in || s.current_user) && (n = e.help(), n.constructor === Array ? i = i.concat(n) : (e.contexts.length && (n.children = r.helpMessagesFor(e.contexts)), i.push(n)));
            return i
        },
        n.prototype.formatCommands = function(t) {
            var e;
            return e = "<table>",
            e += this.messageRows(t),
            e += "</table>"
        },
        n.prototype.messageRows = function(t, e) {
            var n, s, i, r;
            for (s = "", e || (e = ""), t = t.sort(function(t, e) {
                return t.command > e.command ? 1 : -1
            }), i = 0, r = t.length; r > i; i++) n = t[i],
            (n.child !== !0 || "" !== e) && (s += this.messageRow(n, e)),
            n.children && (s += this.messageRows(n.children, "" + e + n.command + " "));
            return s
        },
        n.prototype.messageRow = function(t, e) {
            var n;
            return n = "",
            t.description ? (n += "<tr><td class=command>", n += "" + e + "<strong>" + t.command + "</strong>", n += "</td><td><span>" + t.description + "</span></td></tr>") : ""
        },
        n.prototype.execute = function() {
            var t;
            return t = [],
            t = t.concat(this.helpMessagesFor(this.commandBar.defaultContext.contexts)),
            this.message(this.formatCommands(t))
        },
        n.prototype.suffix = function() {
            return ""
        },
        n
    } (CommandBar.Context),
    CommandBar.Context.register(t)
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c, l = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    u = {}.hasOwnProperty,
    d = function(t, e) {
        function n() {
            this.constructor = t
        }
        for (var s in e) u.call(e, s) && (t[s] = e[s]);
        return n.prototype = e.prototype,
        t.prototype = new n,
        t.__super__ = e.prototype,
        t
    };
    s = function(t) {
        function e() {
            return this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /^([\w\._-]+\/[\w\._-]+)/i,
        e.help = function() {
            return {
                command: "user/repo",
                description: "View a repository"
            }
        },
        e.prototype.repo = function() {
            return this.matches ? this.matches[1] : void 0
        },
        e.prototype.suggestionOptions = function() {
            var t, e, n, s;
            return this.text.match(/^[\w\._-]/i) ? (e = CommandBar.getPageInfo(), t = [], e.current_user && "global" === e.search_choice && (t = this.lazyLoad("/command_bar/repos", {
                loadingMessage: "Loading repositories",
                process: function(t) {
                    return t.results
                }
            })), (s = this.text.match(/([\w\._-]+)\//i)) && (n = s[1], t = this.lazyLoad("/command_bar/repos_for/" + n, {
                loadingMessage: "Loading repositories for " + n,
                process: function(t) {
                    return t.results
                }
            })), t) : []
        },
        e.prototype.description = function() {
            return "Go to " + this.repo()
        },
        e.prototype.helpText = function() {
            return {
                command: "user/repo",
                description: "View user/repo, manage issues, etc."
            }
        },
        e.prototype.execute = function() {
            return this.loading("Loading " + this.repo()),
            this.goToUrl("/" + this.repo() + "?source=c")
        },
        e
    } (CommandBar.Context),
    e = function(t) {
        function e() {
            return this.suffix = l(this.suffix, this),
            this.execute = l(this.execute, this),
            this.branch = l(this.branch, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /@(.+)?/i,
        e.help = function() {
            return {
                child: !0,
                command: "@branchname",
                description: "View a branch in a repository"
            }
        },
        e.prototype.repo = function() {
            return this.parent.repo ? this.parent.repo() : void 0
        },
        e.prototype.suggestionOptions = function() {
            return this.text.match(/^\s@/i) && this.repo() ? this.lazyLoad("/command_bar/" + this.repo() + "/branches", {
                loadingMessage: "Loading " + this.repo() + "'s  branches",
                process: function(t) {
                    return t.results
                }
            }) : [{
                command: "@branchname",
                description: "View a branch in a repository"
            }]
        },
        e.prototype.branch = function() {
            return this.matches ? this.matches[1] : void 0
        },
        e.prototype.description = function() {
            return "Show branch `" + this.branch() + "` for " + this.repo()
        },
        e.prototype.execute = function() {
            return this.repo() && this.branch() ? (this.loading("Loading " + this.repo() + ":" + this.branch() + " branch"), this.goToUrl("/" + this.repo() + "/tree/" + this.branch() + "?source=cb")) : !0
        },
        e.prototype.suffix = function() {
            return ""
        },
        e
    } (CommandBar.Context),
    n = function(t) {
        function e() {
            return this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.skipMatch = !0,
        e.regex = /(.+)?/i,
        e.prototype.repo = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo ? t.repo.name_with_owner: void 0
        },
        e.prototype.suggestionOptions = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            "global" === t.search_choice ? [] : this.lazyLoad("/command_bar/" + this.repo() + "/branches", {
                loadingMessage: "Loading " + this.repo() + "'s  branches",
                process: function(t) {
                    return t.results
                }
            })
        },
        e
    } (CommandBar.Context),
    i = function(t) {
        function e() {
            return this.execute = l(this.execute, this),
            this.number = l(this.number, this),
            this.query = l(this.query, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /\#(.+)/i,
        e.timeout = null,
        e.previous_term = null,
        e.last_suggested = null,
        e.search_delay = 400,
        e.help = function() {
            return {
                child: !0,
                command: "#123",
                description: "View a specific conversation"
            }
        },
        e.prototype.searchDelayPassed = function() {
            return (new Date).getTime() - this.constructor.last_suggested >= this.constructor.search_delay
        },
        e.prototype.repo = function() {
            return this.parent.repo ? this.parent.repo() : void 0
        },
        e.prototype.query = function() {
            return this.matches ? this.matches[1] : void 0
        },
        e.prototype.suggestionOptions = function() {
            return this.text.match(/^\s#/i) && this.repo() ? this.delayedSearch() : [{
                command: "#123",
                description: "View a specific conversation"
            }]
        },
        e.prototype.delayedSearch = function() {
            var t, e, n;
            return n = this.text,
            e = this.constructor.previous_term,
            clearTimeout(this.constructor.timeout),
            this.constructor.previous_term = n,
            n === e && this.searchDelayPassed() ? this.lazyLoad("/command_bar/" + this.repo() + "/issues_for?q=" + encodeURIComponent(n), {
                loadingMessage: "Loading " + this.repo() + "'s issues",
                process: function(t) {
                    return t.results
                }
            }) : (this.constructor.last_suggested = (new Date).getTime(), t = this.commandBar, this.constructor.timeout = setTimeout(function() {
                return t.trigger("suggest.commandbar")
            },
            this.constructor.search_delay), [])
        },
        e.prototype.suffix = function() {
            return ""
        },
        e.prototype.number = function() {
            return this.matches ? this.matches[1] : ""
        },
        e.prototype.description = function() {
            return "Show conversation #" + this.number() + " for " + this.repo()
        },
        e.prototype.execute = function() {
            return this.loading("Loading conversation #" + this.number() + " for " + this.repo()),
            this.goToUrl("/" + this.repo() + "/conversations/" + this.number() + "?source=c")
        },
        e
    } (CommandBar.Context),
    a = function(t) {
        function e() {
            return this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.skipMatch = !0,
        e.regex = new RegExp(""),
        e.timeout = null,
        e.previous_term = null,
        e.last_suggested = null,
        e.search_delay = 400,
        e.prototype.override = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo && !this.text.match(/^([\w\._-]+\/[\w\._-]+)/i) ? t.repo.issues_page: !1
        },
        e.prototype.repo = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo ? t.repo.name_with_owner: void 0
        },
        e.prototype.searchDelayPassed = function() {
            return (new Date).getTime() - this.constructor.last_suggested >= this.constructor.search_delay
        },
        e.prototype.suggestionOptions = function() {
            var t, e;
            return e = this.text,
            t = CommandBar.getPageInfo(),
            this.repo() && "this_repo" === t.search_choice ? this.delayedSearch() : t.current_user ? this.lazyLoad("/command_bar/issues", {
                loadingMessage: "Loading issues",
                process: function(t) {
                    return t.results
                }
            }) : []
        },
        e.prototype.delayedSearch = function() {
            var t, e, n;
            return n = this.text,
            e = this.constructor.previous_term,
            clearTimeout(this.constructor.timeout),
            this.constructor.previous_term = n,
            n === e && this.searchDelayPassed() ? this.lazyLoad("/command_bar/" + this.repo() + "/issues_for?q=" + encodeURIComponent(n), {
                loadingMessage: "Loading " + this.repo() + "'s issues",
                process: function(t) {
                    return t.results
                }
            }) : (this.constructor.last_suggested = (new Date).getTime(), t = this.commandBar, this.constructor.timeout = setTimeout(function() {
                return t.trigger("suggest.commandbar")
            },
            this.constructor.search_delay), [])
        },
        e
    } (CommandBar.Context),
    t = function(t) {
        function e() {
            return this.suffix = l(this.suffix, this),
            this.filename = l(this.filename, this),
            this.fullpath = l(this.fullpath, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /^\s*\/([\w\_\-\.\s]+\/?)+/i,
        e.timeout = null,
        e.previous_term = null,
        e.last_suggested = null,
        e.search_delay = 400,
        e.help = function() {
            return {
                child: !0,
                command: "/path/to/file.s",
                description: "View a blob page"
            }
        },
        e.prototype.repo = function() {
            var t;
            return this.parent.repo ? this.parent.repo() : (t = CommandBar.getPageInfo(), t.repo ? t.repo.name_with_owner: void 0)
        },
        e.prototype.searchDelayPassed = function() {
            return (new Date).getTime() - this.constructor.last_suggested >= this.constructor.search_delay
        },
        e.prototype.fullpath = function() {
            return this.matches ? $.trim(this.matches[0]) : void 0
        },
        e.prototype.filename = function() {
            return this.matches ? $.trim(this.matches[1]) : void 0
        },
        e.prototype.suggestionOptions = function() {
            var t, e, n, s, i;
            return i = this.text,
            e = CommandBar.getPageInfo(),
            i.match(/^[\/\w\._-]/i) ? this.repo() ? (s = e.repo.tree_sha, "" === s || void 0 === s || "global" === e.search_choice ? [] : (n = this.constructor.previous_term, clearTimeout(this.constructor.timeout), this.constructor.previous_term = i, i === n && this.searchDelayPassed() ? this.lazyLoad("/command_bar/" + this.repo() + "/paths/" + e.repo.branch + "?q=" + i + "&sha=" + s, {
                loadingMessage: "Loading " + this.repo() + "'s  files",
                process: function(t) {
                    return t.results
                }
            }) : (this.constructor.last_suggested = (new Date).getTime(), t = this.commandBar, this.constructor.timeout = setTimeout(function() {
                return t.trigger("suggest.commandbar")
            },
            this.constructor.search_delay), []))) : [] : []
        },
        e.prototype.suffix = function() {
            return ""
        },
        e.prototype.execute = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo ? (this.loading("Loading " + this.filename()), this.goToUrl("/" + this.repo() + "/blob/" + t.repo.branch + this.fullpath() + "?source=c")) : null
        },
        e
    } (CommandBar.Context),
    c = function(t) {
        function e() {
            return this.suffix = l(this.suffix, this),
            this.execute = l(this.execute, this),
            this.section = l(this.section, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /^\s*(wiki|graphs|network|pulse|issues|pulls)\b$/i,
        e.help = function() {
            return new this(this.commandBar, "").suggestionOptions()
        },
        e.prototype.repo = function() {
            return this.parent.repo()
        },
        e.prototype.section = function() {
            return this.matches ? this.matches[1] : void 0
        },
        e.prototype.suggestionOptions = function() {
            return [{
                command: "wiki",
                description: "Pull up the wiki"
            },
            {
                command: "graphs",
                description: "All the Graphs!"
            },
            {
                command: "network",
                description: "See the network"
            },
            {
                command: "pulse",
                description: "See recent activity"
            },
            {
                command: "issues",
                description: "View open issues"
            },
            {
                command: "pulls",
                description: "Show open pull requests"
            }]
        },
        e.prototype.description = function() {
            return "View the " + this.section() + " for " + this.repo()
        },
        e.prototype.execute = function() {
            return this.loading("Loading " + this.section() + " for " + this.repo()),
            this.goToUrl("/" + this.repo() + "/" + this.section() + "?source=c")
        },
        e.prototype.suffix = function() {
            return ""
        },
        e
    } (CommandBar.Context),
    o = function(t) {
        function e() {
            return this.suffix = l(this.suffix, this),
            this.execute = l(this.execute, this),
            this.type = l(this.type, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.regex = /^\s*new\s(pull|issues)\b$/i,
        e.logged_in = !0,
        e.help = function() {
            return new this(this.commandBar, "").suggestionOptions()
        },
        e.prototype.repo = function() {
            return this.parent.repo()
        },
        e.prototype.type = function() {
            return this.matches ? this.matches[1] : void 0
        },
        e.prototype.suggestionOptions = function() {
            return [{
                command: "new issues",
                description: "Create new issue"
            },
            {
                command: "new pull",
                description: "Create new pull request"
            }]
        },
        e.prototype.description = function() {
            return "Create a new issue for " + this.repo()
        },
        e.prototype.execute = function() {
            return this.loading("Loading new " + this.type() + " form for " + this.repo()),
            this.goToUrl("/" + this.repo() + "/" + this.type() + "/new?source=c")
        },
        e.prototype.suffix = function() {
            return ""
        },
        e
    } (CommandBar.Context),
    r = function(t) {
        function e() {
            return this.execute = l(this.execute, this),
            this.discussion = l(this.discussion, this),
            this.repo = l(this.repo, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return d(e, t),
        e.contexts = [],
        e.skipMatch = !0,
        e.regex = new RegExp(""),
        e.timeout = null,
        e.previous_term = null,
        e.last_suggested = null,
        e.search_delay = 400,
        e.prototype.repo = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo ? t.repo.name_with_owner: void 0
        },
        e.prototype.discussion = function() {
            return this.matches ? this.matches[1] : ""
        },
        e.prototype.searchDelayPassed = function() {
            return (new Date).getTime() - this.constructor.last_suggested >= this.constructor.search_delay
        },
        e.prototype.suggestionOptions = function() {
            var t, e;
            return e = this.text,
            t = CommandBar.getPageInfo(),
            this.repo() && "this_repo" === t.search_choice ? this.delayedSearch() : t.current_user ? this.lazyLoad("/command_bar/discussions", {
                loadingMessage: "Loading discussions",
                process: function(t) {
                    return t.results
                }
            }) : []
        },
        e.prototype.delayedSearch = function() {
            var t, e, n;
            return n = this.text,
            e = this.constructor.previous_term,
            clearTimeout(this.constructor.timeout),
            this.constructor.previous_term = n,
            n === e && this.searchDelayPassed() ? this.lazyLoad("/command_bar/" + this.repo() + "/discussions_for?q=" + encodeURIComponent(n), {
                loadingMessage: "Loading " + this.repo() + "'s discussions",
                process: function(t) {
                    return t.results
                }
            }) : (this.constructor.last_suggested = (new Date).getTime(), t = this.commandBar, this.constructor.timeout = setTimeout(function() {
                return t.trigger("suggest.commandbar")
            },
            this.constructor.search_delay), [])
        },
        e.prototype.execute = function() {
            return this.loading("Loading discussion #" + this.discussion() + " for " + this.repo()),
            this.goToUrl("/" + this.repo() + "/discussion/" + this.discussion() + "?source=c")
        },
        e
    } (CommandBar.Context),
    CommandBar.Context.register(s),
    CommandBar.Context.register(n),
    CommandBar.Context.register(t),
    CommandBar.Context.register(a),
    s.register(i),
    s.register(e),
    s.register(t),
    s.register(o),
    s.register(c),
    $(function() {
        return $("#serverstats.enabled").length ? CommandBar.Context.register(r) : void 0
    })
}.call(this),
function() {
    var t, e, n = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    s = {}.hasOwnProperty,
    i = function(t, e) {
        function n() {
            this.constructor = t
        }
        for (var i in e) s.call(e, i) && (t[i] = e[i]);
        return n.prototype = e.prototype,
        t.prototype = new n,
        t.__super__ = e.prototype,
        t
    };
    e = function(t) {
        function e() {
            return this.suffix = n(this.suffix, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return i(e, t),
        e.contexts = [],
        e.regex = /^search\sgithub\sfor\s'(.+)'$/i,
        e.prototype.search = function() {
            return ! 0
        },
        e.prototype.query = function() {
            return this.matches ? $.trim(this.matches[1]) : void 0
        },
        e.prototype.suggestionOptions = function() {
            return [{
                command: "Search GitHub for '" + this.text + "'",
                description: "",
                multiplier: 0,
                defaultScore: -2,
                url: "/search?q=" + encodeURIComponent(this.text),
                skip_fuzzy: !0
            }]
        },
        e.prototype.description = function() {
            return "Search GitHub for " + this.query()
        },
        e.prototype.execute = function() {
            return this.loading("Searching for '" + this.query() + "'"),
            this.goToUrl("/search?q=" + encodeURIComponent(this.query()))
        },
        e.prototype.suffix = function() {
            return ""
        },
        e
    } (CommandBar.Context),
    t = function(t) {
        function e() {
            return this.suffix = n(this.suffix, this),
            e.__super__.constructor.apply(this, arguments)
        }
        return i(e, t),
        e.contexts = [],
        e.regex = /^search\s([\w\._-]+\/[\w\._-]+)\sfor\s'(.+)'$/i,
        e.prototype.search = function() {
            return ! 0
        },
        e.prototype.query = function() {
            return this.matches ? $.trim(this.matches[2]) : void 0
        },
        e.prototype.repomatch = function() {
            return this.matches ? $.trim(this.matches[1]) : void 0
        },
        e.prototype.suggestionOptions = function() {
            var t;
            return t = CommandBar.getPageInfo(),
            t.repo ? [{
                command: "Search " + t.repo.name_with_owner + " for '" + this.text + "'",
                description: "",
                multiplier: 0,
                defaultScore: -1,
                url: "/" + t.repo.name_with_owner + "/search?q=" + encodeURIComponent(this.text),
                skip_fuzzy: !0
            }] : []
        },
        e.prototype.description = function() {
            return "Search GitHub for " + this.query()
        },
        e.prototype.execute = function() {
            return this.loading("Searching for '" + this.query() + "'"),
            this.goToUrl("/" + this.repomatch() + "/search?q=" + encodeURIComponent(this.query()))
        },
        e.prototype.suffix = function() {
            return ""
        },
        e
    } (CommandBar.Context),
    CommandBar.Context.register(e),
    CommandBar.Context.register(t)
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    n = {}.hasOwnProperty,
    s = function(t, e) {
        function s() {
            this.constructor = t
        }
        for (var i in e) n.call(e, i) && (t[i] = e[i]);
        return s.prototype = e.prototype,
        t.prototype = new s,
        t.__super__ = e.prototype,
        t
    };
    t = function(t) {
        function n() {
            return this.suffix = e(this.suffix, this),
            this.user = e(this.user, this),
            n.__super__.constructor.apply(this, arguments)
        }
        return s(n, t),
        n.contexts = [],
        n.regex = /^@([A-Za-z0-9-_]+)\/?/i,
        n.timeout = null,
        n.previous_term = null,
        n.last_suggested = null,
        n.search_delay = 400,
        n.help = function() {
            return {
                command: "@user",
                description: "View a user&rsquo;s profile"
            }
        },
        n.matches = function(t) {
            var e;
            return e = t.match(this.regex),
            !!e && !e[0].match(/\/$/)
        },
        n.prototype.searchDelayPassed = function() {
            return (new Date).getTime() - this.constructor.last_suggested >= this.constructor.search_delay
        },
        n.prototype.suggestionOptions = function() {
            var t, e, n, s;
            return s = this.text,
            s.match(/^[@\w\._-]/i) ? (e = CommandBar.getPageInfo(), this.text.match(/^@[\w\._-]/i) ? (n = this.constructor.previous_term, clearTimeout(this.constructor.timeout), this.constructor.previous_term = s, s === n && this.searchDelayPassed() ? this.lazyLoad("/command_bar/users?q=" + this.user(), {
                loadingMessage: "Loading users",
                process: function(t) {
                    return t.results
                }
            }) : (this.constructor.last_suggested = (new Date).getTime(), t = this.commandBar, this.constructor.timeout = setTimeout(function() {
                return t.trigger("suggest.commandbar")
            },
            this.constructor.search_delay), [])) : e.current_user && "global" === e.search_choice ? this.lazyLoad("/command_bar/users", {
                loadingMessage: "Loading users",
                process: function(t) {
                    return t.results
                }
            }) : []) : []
        },
        n.prototype.user = function() {
            return this.matches ? this.matches[1] : void 0
        },
        n.prototype.suffix = function() {
            return ""
        },
        n.prototype.execute = function() {
            return this.loading("Loading " + this.user() + "'s profile"),
            this.goToUrl("/" + this.user())
        },
        n
    } (CommandBar.Context),
    CommandBar.Context.register(t)
}.call(this),
function() {}.call(this),
function() {
    var t, e;
    e = null,
    $.conduit = function(t) {
        var n;
        return n = $.Deferred(),
        (null != e ? e: e = $("link[rel=conduit-xhr]").prop("href")) ? $.ajax({
            url: "" + e + t,
            success: function(t) {
                return n.resolve(t)
            },
            error: function() {
                return n.reject()
            }
        }) : n.reject(),
        n.promise()
    },
    t = null,
    $.conduit.status = function() {
        return null != t ? t: t = $.conduit("status")
    },
    $.conduit.capable = function(t) {
        return $.conduit.status().then(function(e) {
            var n;
            return n = $.Deferred(),
            -1 !== e.capabilities.indexOf(t) ? n.resolve() : n.reject()
        })
    }
}.call(this),
function() {
    var t;
    $.observe(".js-conduit-openfile-check", t = function(t) {
        $.conduit.capable("url-parameter-filepath").done(function() {
            return $(t).attr("href", $(t).attr("data-url"))
        }).fail(function() {
            return $(t).addClass("disabled").attr("aria-label", $(t).attr("data-failed-title"))
        })
    })
}.call(this),
function() {
    var t;
    $.observe(".js-conduit-rewrite-url", t = function(t) {
        $.conduit.status().done(function() {
            return t.href = t.getAttribute("data-url")
        })
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o;
    n = null,
    s = null,
    a = null,
    o = null,
    e = function(t) {
        var e;
        return e = $("<img>", {
            "class": "dots",
            src: "/images/spinners/octocat-spinner-128.gif"
        }),
        $("#contribution-activity-listing").html(e),
        $.pjax({
            url: t,
            container: "#contribution-activity",
            scrollTo: !1,
            replace: !0
        })
    },
    i = function(t) {
        var s, i;
        return n = t,
        s = null,
        a = null,
        o = null,
        i = "" + document.location.pathname + "?tab=contributions&period=" + n,
        r(),
        e(i)
    },
    r = function(t, e) {
        var n, s;
        return s = $(".calendar-graph"),
        n = d3.select(".js-calendar-graph").selectAll("rect.day").classed("active", !1),
        t || e ? (s.addClass("days-selected"), n.filter(function(n) {
            return t && e ? n[0] >= t && n[0] <= e: n[0] === t
        }).classed("active", !0)) : s.removeClass("days-selected")
    },
    $(document).on("contributions:range",
    function(t, c, l) {
        var u, d, h, f, m, p, g, v, $, y;
        return null == l && (l = !1),
        g = "" + document.location.pathname + "?tab=contributions",
        c >= a && o >= c ? (i("weekly"), void 0) : ("object" == typeof l && (s = l, l = !0), s && l ? (m = moment(s).clone().subtract("days", 31).toDate(), f = moment(s).clone().add("days", 31).toDate(), v = c > s ? [s, c] : [c, s], h = v[0], p = v[1], m > h && (h = m), p > f && (p = f), $ = [h, p], a = $[0], o = $[1], u = moment(h).format("YYYY-MM-DD"), d = moment(p).format("YYYY-MM-DD"), g += "&from=" + u + "&to=" + d) : (h = c, y = [h, null], a = y[0], o = y[1], u = moment(h).format("YYYY-MM-DD"), g += "&from=" + u), s = c, n = "custom", r(h, p), e(g))
    }),
    $(document).on("change", ".js-period-container",
    function(t) {
        var e;
        return t.preventDefault(),
        t.stopPropagation(),
        e = $(t.target).val().toLowerCase(),
        n !== e ? i(e) : void 0
    }),
    $(t = function() {
        var t;
        return t = $(".popular-repos .col").height() - 20,
        $(".popular-repos .capped-box").css("height", "" + t + "px")
    })
}.call(this),
function() {
    var t, e;
    $(document).on("submit", ".js-find-coupon-form",
    function(t) {
        var e, n;
        return e = t.target.action,
        n = $("#code").val(),
        window.location = e + "/" + encodeURIComponent(n),
        t.stopPropagation(),
        t.preventDefault()
    }),
    $(document).on("click", ".js-choose-account",
    function(e) {
        return $(".js-plan-row, .js-choose-plan").removeClass("selected"),
        $(".js-plan").val(""),
        $(".js-billing-section").addClass("is-hidden"),
        Billing.displayCreditCardFields(!1),
        t($(this).closest(".js-account-row")),
        e.stopPropagation(),
        e.preventDefault()
    }),
    $(document).on("click", ".js-choose-plan",
    function(t) {
        return e($(this).closest(".js-plan-row")),
        t.stopPropagation(),
        t.preventDefault()
    }),
    $.observe(".js-plan-row.selected:not(.free-plan)", {
        add: function() {
            return $(this).closest("form").find(".js-redeem-button").prop("disabled", !1)
        },
        remove: function() {
            return $(this).closest("form").find(".js-redeem-button").prop("disabled", !0)
        }
    }),
    t = function(t) {
        var n, s, i;
        if (t.length) return s = t.data("login"),
        i = t.data("plan"),
        $(".js-account-row, .js-choose-account").removeClass("selected"),
        t.addClass("selected"),
        t.find(".js-choose-account").addClass("selected"),
        $(".js-account").val(s),
        $(".js-plan-section").removeClass("is-hidden"),
        $(".js-billing-plans").addClass("is-hidden"),
        $(".js-plans-for-" + s).removeClass("is-hidden"),
        n = $(".js-plans-for-" + s + " .js-plan-row"),
        1 === n.length ? e(n) : e($("[data-name='" + i + "']"))
    },
    e = function(t) {
        var e, n, s;
        if (t.length) return s = t.data("name"),
        n = t.closest(".js-billing-plans").data("has-billing"),
        e = parseInt(t.data("cost"), 10),
        $(".js-plan-row, .js-choose-plan").removeClass("selected"),
        t.addClass("selected"),
        t.find(".js-choose-plan").addClass("selected"),
        $(".js-plan").val(s),
        0 === e || n ? ($(".js-billing-section").addClass("is-hidden"), Billing.displayCreditCardFields(!1)) : ($(".js-billing-section").removeClass("is-hidden"), Billing.displayCreditCardFields(!0))
    },
    $(function() {
        return t($(".coupons .js-account-row.selected")),
        e($(".coupons .js-plan-row.selected"))
    })
}.call(this),
function() {
    $(document).on("click", ".js-git-protocol-selector",
    function() {
        var t, e, n;
        return t = $(this).closest(".url-box"),
        n = $(this).attr("href"),
        e = $(this).attr("data-permission"),
        t.find(".js-url-field").val(n),
        t.find(".js-zeroclipboard").attr("data-clipboard-text", n),
        t.find(".js-clone-url-permission").text(e),
        $(".js-live-clone-url").text(n),
        (n = $(this).attr("data-url")) && $.ajax({
            type: "POST",
            url: n
        }),
        t.find(".js-clone-urls > .selected").removeClass("selected"),
        $(this).parent(".js-clone-url-button").addClass("selected"),
        !1
    }),
    $(document).on("mouseup", ".js-url-field",
    function() {
        return $(this).select()
    }),
    $(document).on("click", ".js-clone-selector",
    function(t) {
        var e, n, s, i;
        return t.preventDefault(),
        e = $(this).attr("data-protocol"),
        i = $(".clone-url").hide(),
        n = i.filter('[data-protocol-type="' + e + '"]').show(),
        (s = n.attr("data-url")) ? $.ajax({
            type: "POST",
            url: s
        }) : void 0
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o = [].slice;
    t = [],
    a = !1,
    s = function() {
        a = !0
    },
    n = function() {
        a = !1
    },
    $(window).on("pageshow", n),
    $(window).on("pagehide", s),
    $(window).on("error",
    function(e) {
        var n, s, r, c, l, u;
        u = e.originalEvent,
        l = u.message,
        r = u.filename,
        c = u.lineno,
        s = u.error,
        null != (null != s ? s.stack: void 0) && !a && c && (n = $.extend.apply($, [{}].concat(o.call(t), [{
            message: l,
            filename: r,
            lineno: c,
            url: window.location.href,
            readyState: document.readyState,
            referrer: document.referrer,
            stack: s.stack
        }])), t = [], null != n.eventTarget && (n.eventTarget = i(n.eventTarget)), $.ajax({
            type: "POST",
            url: "/_errors",
            data: {
                error: n
            }
        }))
    }),
    i = function(t) {
        var e;
        for (e = []; null != t && (e.push(r(t)), t !== document.body && !t.id);) t = t.parentNode;
        return e.reverse().join(" > ")
    },
    r = function(t) {
        var e, n, s, i;
        return t === window ? "window": (n = [t.nodeName.toLowerCase()], (null != (s = t.id) ? s.length: void 0) && n.push("#" + t.id), e = null != (i = t.className) ? i.trim().split(/\s+/).join(".") : void 0, (null != e ? e.length: void 0) && n.push("." + e), n.join(""))
    },
    "#b00m" === window.location.hash && b00m()
}.call(this),
function() {
    $(document).on("click", ".email-hidden-toggle > a",
    function() {
        return $(this).parent().siblings(".email-hidden-reply").toggle(),
        !1
    })
}.call(this),
function() {
    var t, e, n, s, i, r;
    null == window._gaq && (window._gaq = []),
    _gaq.push(["_setAccount", "UA-3769691-2"]),
    _gaq.push(["_setDomainName", "none"]),
    $(document).ready(function() {
        return $(document.body).hasClass("logged_in") ? _gaq.push(["_setCustomVar", 1, "Session Type", "Logged In", 2]) : _gaq.push(["_setCustomVar", 1, "Session Type", "Logged Out", 2]),
        _gaq.push(["_trackPageview"])
    }),
    "404 - GitHub" === document.title && (i = document.location.pathname + document.location.search, e = document.referrer, _gaq.push(["_trackPageview", "/404.html?page=" + i + "&from=" + e])),
    n = document.createElement("script"),
    n.type = "text/javascript",
    n.async = !0,
    s = "https:" === document.location.protocol ? "https://ssl": "http://www",
    n.src = "" + s + ".google-analytics.com/ga.js",
    document.getElementsByTagName("head")[0].appendChild(n),
    t = function(t, e, n, s) {
        return _gaq.push(["_trackEvent", t, e, n, s])
    },
    r = function() {
        var e, n, s, i;
        return n = $("meta[name=analytics-event-category]"),
        n.length ? (e = $("meta[name=analytics-event-action]"), s = $("meta[name=analytics-event-label]"), i = $("meta[name=analytics-event-value]"), t(n.attr("content"), e.attr("content"), s.attr("content"), i.attr("content")), n.remove(), e.remove(), s.remove(), i.remove()) : void 0
    },
    $(function() {
        return r()
    }),
    $(document).on("pjax:complete",
    function() {
        var t;
        return t = document.location.pathname,
        "undefined" != typeof _octo && null !== _octo && _octo.push(["recordPageView"]),
        "undefined" != typeof _gaq && null !== _gaq && ($(document.body).hasClass("logged_in") ? _gaq.push(["_setCustomVar", 1, "Session Type", "Logged In", 2]) : _gaq.push(["_setCustomVar", 1, "Session Type", "Logged Out", 2]), _gaq.push(["_trackPageview", t])),
        setTimeout(function() {
            return r()
        },
        20)
    }),
    $(function() {
        var e;
        return e = !1,
        $(".js-form-signup-home").on("keyup", "input[type=text]",
        function() {
            return e ? void 0 : (t("Signup", "Attempt", "Homepage Form"), e = !0)
        }),
        $(".js-form-signup-detail").on("keyup", "input[type=text]",
        function() {
            return e ? void 0 : (t("Signup", "Attempt", "Detail Form"), e = !0)
        })
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c, l;
    c = 721,
    e = 110,
    l = [20, 0, 0, 20],
    r = l[0],
    i = l[1],
    n = l[2],
    s = l[3],
    t = 13,
    a = 2,
    o = function(t) {
        var e, n, s, i, r;
        if (s = t.length, 1 > s) return 0 / 0;
        if (1 === s) return 0;
        for (n = d3.mean(t), e = -1, i = 0; ++e < s;) r = t[e] - n,
        i += r * r;
        return i / (s - 1)
    },
    $(document).on("graph:load", ".js-calendar-graph",
    function(n, i) {
        var l, u, d, h, f, m, p, g, v, y, b, j, w, x, C, k, S, _, T, D, M, P, A, B, L, E, F, I, z, q;
        for (l = $(this), f = l.attr("data-from"), f && (f = C = moment(f).toDate()), P = l.attr("data-to"), P && (P = moment(P).toDate()), i || (i = []), i = i.map(function(t) {
            return [new Date(t[0]), t[1]]
        }).sort(function(t, e) {
            return d3.ascending(t[0], e[0])
        }), u = 3.77972616981, w = i.map(function(t) {
            return t[1]
        }), T = Math.sqrt(o(w)), y = d3.mean(w), _ = 3, p = d3.max(w), A = v - y, (6 > A || 15 > p) && (_ = 1), x = 0; _ > x;) B = w.filter(function(t) {
            var e;
            return e = Math.abs((y - t) / T),
            e > u
        }),
        B.length > 0 ? (B = B[0], w = w.filter(function(t) {
            return t !== B
        }), 0 === x && (g = w)) : B = null,
        x += 1;
        return v = d3.max(w),
        k = ["#d6e685", "#8cc665", "#44a340", "#1e6823"],
        m = d3.scale.quantile().domain([0, v]).range(k),
        h = d3.time.format("%w"),
        q = d3.time.format("%Y%U"),
        z = d3.time.format("%m-%y"),
        b = d3.time.format("%b"),
        F = {},
        j = {},
        i.forEach(function(t) {
            var e;
            return e = q(t[0]),
            F[e] || (F[e] = []),
            F[e].push(t)
        }),
        F = d3.entries(F),
        F.forEach(function(t) {
            var e;
            return e = z(t.value[0][0]),
            j[e] || (j[e] = [t.value[0][0], 0]),
            j[e][1] += 1
        }),
        j = d3.entries(j).sort(function(t, e) {
            return d3.ascending(t.value[0], e.value[0])
        }),
        M = d3.tip().attr("class", "svg-tip").offset([ - 10, 0]).html(function(t) {
            var e;
            return e = 0 === t[1] ? "No": t[1],
            "<strong>" + e + " " + $.pluralize(t[1], "contribution") + "</strong> on " + moment(t[0]).format("MMMM Do YYYY")
        }),
        L = d3.select(this).append("svg").attr("width", c).attr("height", e).attr("id", "calendar-graph").append("g").attr("transform", "translate(" + s + ", " + r + ")").call(M),
        E = 0,
        D = (new Date).getFullYear(),
        I = L.selectAll("g.week").data(F).enter().append("g").attr("transform",
        function(e, n) {
            var s;
            return s = e.value[0][0],
            s.getFullYear() === D && 0 !== s.getDay() && 0 === E && (E = -1),
            "translate(" + (n + E) * t + ", 0)"
        }),
        S = I.selectAll("rect.day").data(function(t) {
            return t.value
        }).enter().append("rect").attr("class", "day").attr("width", t - a).attr("height", t - a).attr("y",
        function(e) {
            return h(e[0]) * t
        }).style("fill",
        function(t) {
            return 0 === t[1] ? "#eee": m(t[1])
        }).on("click",
        function(t) {
            return $(document).trigger("contributions:range", [t[0], d3.event.shiftKey])
        }).on("mouseover", M.show).on("mouseout", M.hide),
        d = 0,
        L.selectAll("text.month").data(j).enter().append("text").attr("x",
        function(e) {
            var n;
            return n = t * d,
            d += e.value[1],
            n
        }).attr("y", -5).attr("class", "month").style("display",
        function(t) {
            return t.value[1] <= 2 ? "none": void 0
        }).text(function(t) {
            return b(t.value[0])
        }),
        L.selectAll("text.day").data(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).enter().append("text").style("display",
        function(t, e) {
            return 0 === e % 2 ? "none": void 0
        }).attr("text-anchor", "middle").attr("class", "wday").attr("dx", -10).attr("dy",
        function(e, n) {
            return r + ((n - 1) * t + a)
        }).text(function(t) {
            return t[0]
        }),
        f || P ? $(document).trigger("contributions:range", [f, P]) : void 0
    })
}.call(this),
function() {
    $(document).on("graph:load", ".js-graph-code-frequency",
    function(t, e) {
        var n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v, y, b, j;
        return p = $(this).width(),
        r = 500,
        j = [10, 10, 20, 40],
        d = j[0],
        u = j[1],
        c = j[2],
        l = j[3],
        e = e.map(function(t) {
            return [new Date(1e3 * t[0]), t[1], t[2]]
        }).sort(function(t, e) {
            return d3.ascending(t[0], e[0])
        }),
        n = e.map(function(t) {
            return [t[0], t[1]]
        }),
        i = e.map(function(t) {
            return [t[0], t[2]]
        }),
        a = d3.max(n,
        function(t) {
            return t[1]
        }),
        o = d3.min(i,
        function(t) {
            return t[1]
        }),
        m = e[0][0],
        f = e[e.length - 1][0],
        g = d3.time.scale().domain([m, f]).range([0, p - l - u]),
        y = d3.scale.linear().domain([o, a]).range([r - c - d, 0]),
        v = d3.svg.axis().scale(g).tickFormat(function(t) {
            return m.getFullYear() !== f.getFullYear() ? d3.time.format("%m/%y")(t) : d3.time.format("%m/%d")(t)
        }),
        b = d3.svg.axis().scale(y).orient("left").tickPadding(5).tickSize(p).tickFormat(function(t) {
            return d3.formatSymbol(t, !0)
        }),
        s = d3.svg.area().x(function(t) {
            return g(t[0])
        }).y0(function(t) {
            return y(t[1])
        }).y1(function() {
            return y(0)
        }),
        h = d3.select(this).data(e).append("svg").attr("width", p).attr("height", r).attr("class", "viz code-frequency").append("g").attr("transform", "translate(" + l + "," + d + ")"),
        h.append("g").attr("class", "x axis").attr("transform", "translate(0, " + (r - d - c) + ")").call(v),
        h.append("g").attr("class", "y axis").attr("transform", "translate(" + p + ", 0)").call(b),
        h.selectAll("path.area").data([n, i]).enter().append("path").attr("class",
        function(t, e) {
            return 0 === e ? "addition": "deletion"
        }).attr("d", s)
    })
}.call(this),
function() {
    $(document).on("graph:load", ".js-commit-activity-graph",
    function(t, e) {
        var n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v, y, b, j, w, x;
        return c = $("#commit-activity-master"),
        s = $("#commit-activity-detail"),
        a = 260,
        g = s.width(),
        v = 0,
        function() {
            var t, n, r, o, c, l, u, d, h, f, m, p, y, b, j, w, x, C, k, S, _;
            for (l = 0, c = k = 0, S = e.length; S > k; c = ++k) t = e[c],
            0 !== t.total && (l = c);
            return v = l,
            _ = [20, 30, 30, 40],
            m = _[0],
            h = _[1],
            f = _[2],
            d = _[3],
            r = e[v].days,
            u = d3.max(e,
            function(t) {
                return d3.max(t.days)
            }),
            j = d3.scale.linear().domain([0, r.length - 1]).range([0, g - h - f]),
            x = d3.scale.linear().domain([0, u]).range([a, 0]),
            C = d3.svg.axis().scale(x).orient("left").ticks(5).tickSize( - g + f + h),
            $(document).on("gg.week.selected",
            function(t, e) {
                return y(e)
            }),
            $(document).on("keyup",
            function(t) {
                var n, s;
                return n = v,
                37 === (s = t.keyCode) || 39 === s ? (v > 0 && 37 === t.keyCode && (n -= 1), v < e.length && 39 === t.keyCode && (n += 1), y({
                    index: n
                })) : void 0
            }),
            b = d3.select(s[0]).data([r]).append("svg").attr("width", g).attr("height", a + m + d).attr("class", "viz").append("g").attr("transform", "translate(" + h + "," + m + ")"),
            b.append("g").attr("class", "y axis").call(C),
            w = b.append("g").attr("class", "axis"),
            n = w.selectAll(".day").data(d3.weekdays).enter().append("g").attr("class", "day").attr("transform",
            function(t, e) {
                return "translate(" + j(e) + ", " + a + ")"
            }),
            n.append("text").attr("text-anchor", "middle").attr("dy", "2em").text(function(t) {
                return t
            }),
            p = d3.svg.line().x(function(t, e) {
                return j(e)
            }).y(x),
            b.append("path").attr("class", "path").attr("d", p),
            o = b.selectAll("g.dot").data(r).enter().append("g").attr("class", "dot").attr("transform",
            function(t, e) {
                return "translate(" + j(e) + ", " + x(t) + ")"
            }),
            o.append("circle").attr("r", 4),
            o.append("text").attr("text-anchor", "middle").attr("class", "tip").attr("dy", -10).text(function(t) {
                return t
            }),
            y = function(t) {
                var n, s, a;
                if (! (t.index >= 52 || t.index < 0)) return v = t.index,
                r = e[t.index].days,
                u = d3.max(r),
                j.domain([0, r.length - 1]),
                a = d3.selectAll(".bar.mini").attr("class", "bar mini"),
                n = d3.select(a[0][v]).attr("class", "bar mini active"),
                s = d3.transform(n.attr("transform")),
                i.transition().ease("back-out").duration(300).attr("transform", "translate(" + (s.translate[0] + 8) + ", 105)"),
                b.selectAll(".path").data([r]).transition().duration(500).attr("d", p),
                b.selectAll("g.dot").data(r).transition().duration(300).attr("transform",
                function(t, e) {
                    return "translate(" + j(e) + ", " + x(t) + ")"
                }),
                b.selectAll("text.tip").data(r).text(function(t) {
                    return t
                })
            }
        } (),
        x = [10, 30, 20, 30],
        h = x[0],
        u = x[1],
        d = x[2],
        l = x[3],
        a = 100,
        m = e.map(function(t) {
            return t.total
        }),
        o = d3.max(m),
        r = d3.time.format("%m/%d"),
        y = d3.scale.ordinal().domain(d3.range(m.length)).rangeRoundBands([0, g - u - d], .1),
        j = d3.scale.linear().domain([0, o]).range([a, 0]),
        w = d3.svg.axis().scale(j).orient("left").ticks(3).tickSize( - g + u + d).tickFormat(d3.formatSymbol),
        b = d3.svg.axis().scale(y).ticks(d3.time.weeks).tickFormat(function(t, n) {
            var s;
            return s = new Date(1e3 * e[n].week),
            r(s)
        }),
        f = d3.tip().attr("class", "svg-tip").offset([ - 10, 0]).html(function(t, n) {
            var s;
            return s = moment(1e3 * e[n].week),
            "<strong>" + t + "</strong> " + $.pluralize(t, "commit") + " the week of " + s.format("MMMM Do")
        }),
        p = d3.select(c[0]).style("width", "" + g + "px").append("svg").attr("width", g + (u + d)).attr("height", a + h + l).attr("class", "viz").append("g").attr("transform", "translate(" + u + "," + h + ")").call(f),
        p.append("g").attr("class", "y axis").call(w),
        n = p.selectAll("g.mini").data(m).enter().append("g").attr("class",
        function(t, e) {
            return e === v ? "bar mini active": "bar mini"
        }).attr("transform",
        function(t, e) {
            return "translate(" + y(e) + ", 0)"
        }).on("click",
        function(t, e) {
            return $(document).trigger("gg.week.selected", {
                node: this,
                index: e,
                data: t
            })
        }),
        n.append("rect").attr("width", y.rangeBand()).attr("height",
        function(t) {
            return a - j(t)
        }).attr("y",
        function(t) {
            return j(t)
        }).on("mouseover", f.show).on("mouseout", f.hide),
        p.append("g").attr("class", "x axis").attr("transform", "translate(0," + a + ")").call(b).selectAll(".tick").style("display",
        function(t, e) {
            return 0 !== e % 3 ? "none": "block"
        }),
        i = p.append("circle").attr("class", "focus").attr("r", 8).attr("transform", "translate(" + (y(v) + y.rangeBand() / 2) + ", " + -a + ")"),
        i.transition().ease("elastic-in").duration(1e3).attr("r", 2).attr("transform", "translate(" + (y(v) + y.rangeBand() / 2) + ", " + (a + 5) + ")")
    })
}.call(this),
function() {
    var t, e, n, s, i;
    t = d3.time.format("%Y-%m-%d"),
    n = function(t) {
        return new Date(1e3 * ~~t)
    },
    s = function() {
        var t, e, n, s, i, r, a, o;
        for (n = {},
        a = document.location.search.substr(1).split("&"), i = 0, r = a.length; r > i; i++) e = a[i],
        o = e.split("="),
        t = o[0],
        s = o[1],
        n[t] = s;
        return n
    },
    i = function(t, e) {
        var n, s, i, r;
        return i = "MMMM Do YYYY",
        r = moment(t).format(i),
        s = moment(e).format(i),
        n = $("#js-date-range").attr("data-default-branch"),
        $("#js-date-range").html("" + r + " <span class='dash'>&dash;</span> " + s + " <p class='info'>Commits to " + $.escapeHTML(n) + ", excluding merge commits</p>")
    },
    e = function(t) {
        var e, n;
        return e = moment(t[0].weeks[0].date),
        n = e.subtract("weeks", 1),
        t.forEach(function(t) {
            return t.weeks.unshift({
                a: 0,
                c: 0,
                d: 0,
                date: n.toDate(),
                w: n / 1e3
            })
        })
    },
    $(document).on("graph:load", "#contributors",
    function(r, a) {
        var o, c, l, u, d, h, f, m, p, g, v, y, b, j, w, x, C;
        return c = $(this),
        l = [],
        m = s(),
        C = null,
        x = null,
        null != m.from && (b = moment(m.from).toDate()),
        null != m.to && (d = moment(m.to).toDate()),
        u = (null != m ? m.type: void 0) || "c",
        c.on("range.selection.end",
        function(e, n) {
            var s;
            return s = n.range,
            b = s[0],
            d = s[1],
            t(b) === t(d) && (b = C, d = x),
            w(),
            i(b, d),
            v()
        }),
        g = function(t) {
            var s;
            return 1 === t[0].weeks.length && e(t),
            s = o(t),
            C = n(s[0].key),
            x = n(s[s.length - 1].key),
            null == b && (b = C),
            null == d && (d = x),
            i(b, d),
            y(s, C, x),
            v(t, C, x),
            $(".js-contribution-container").on("change", "input[type=radio]", f)
        },
        p = function(t) {
            var e, n, s, i, r, a, o;
            for (s = 0, r = t.length; r > s; s++) for (e = t[s], o = e.weeks, i = 0, a = o.length; a > i; i++) n = o[i],
            n.date = new Date(1e3 * n.w);
            return t
        },
        h = function(t, e) {
            return t.map(function(t) {
                var n;
                return n = $.extend(!0, {},
                t),
                n.weeks = n.weeks.filter(function(t) {
                    return t.date >= e[0] && t.date <= e[1]
                }),
                n
            })
        },
        o = function(t) {
            var e, n, s, i, r, a, o, c, l;
            for (n = {},
            i = 0, a = t.length; a > i; i++) for (e = t[i], l = e.weeks, r = 0, o = l.length; o > r; r++) s = l[r],
            null == n[c = s.w] && (n[c] = {
                c: 0,
                a: 0,
                d: 0
            }),
            n[s.w].c += s.c,
            n[s.w].a += s.a,
            n[s.w].d += s.d;
            return d3.entries(n)
        },
        j = function(t) {
            return t = h(t, [b, d]),
            t.forEach(function(t) {
                var e, n, s, i, r, a, o;
                for (n = 0, e = 0, s = 0, o = t.weeks, r = 0, a = o.length; a > r; r++) i = o[r],
                n += i.c,
                e += i.a,
                s += i.d;
                return t.c = n,
                t.a = e,
                t.d = s
            }),
            t.sort(function(t, e) {
                return d3.descending(t[u], e[u])
            })
        },
        y = function(e, s, i) {
            var r, a, o, l, h, f, m, p, g, v, $, y, j, w, x, C, k, S;
            return S = [20, 50, 20, 30],
            p = S[0],
            f = S[1],
            m = S[2],
            h = S[3],
            j = c.width(),
            o = 125,
            l = d3.max(e,
            function(t) {
                return t.value[u]
            }),
            w = d3.time.scale().domain([s, i]).range([0, j - f - m]),
            C = d3.scale.linear().domain([0, l]).range([o, 0]),
            k = d3.svg.axis().scale(C).orient("left").ticks(4).tickSize( - j + f + m).tickPadding(10).tickFormat(d3.formatSymbol),
            x = d3.svg.axis().scale(w),
            e.length < 5 && x.ticks(e.length),
            r = d3.svg.area().interpolate("basis").x(function(t) {
                return w(n(t.key))
            }).y0(function() {
                return o
            }).y1(function(t) {
                return C(t.value[u])
            }),
            d3.select("#contributors-master svg").remove(),
            y = d3.select("#contributors-master").data([e]).append("svg").attr("height", o + p + h).attr("width", j).attr("class", "viz").append("g").attr("transform", "translate(" + f + "," + p + ")"),
            y.append("g").attr("class", "x axis").attr("transform", "translate(0, " + o + ")").call(x),
            y.append("g").attr("class", "y axis").call(k),
            y.append("path").attr("class", "area").attr("d", r),
            $ = function() {
                var t;
                return y.classed("selecting", !0),
                t = d3.event.target.extent(),
                c.trigger("range.selection.start", {
                    data: arguments[0],
                    range: t
                })
            },
            g = function() {
                var t, e;
                return t = d3.time.format("%m/%d/%Y"),
                e = d3.event.target.extent(),
                c.trigger("range.selection.selected", {
                    data: arguments[0],
                    range: e
                })
            },
            v = function() {
                var t;
                return y.classed("selecting", !d3.event.target.empty()),
                t = d3.event.target.extent(),
                c.trigger("range.selection.end", {
                    data: arguments[0],
                    range: t
                })
            },
            a = d3.svg.brush().x(w).on("brushstart", $).on("brush", g).on("brushend", v),
            (t(b) !== t(s) || t(d) !== t(i)) && a.extent([b, d]),
            y.append("g").attr("class", "selection").call(a).selectAll("rect").attr("height", o)
        },
        v = function() {
            var t, e, n, s, i, r, o, c, h, f, m, p, g, v, y, w, x, C, k, S, _;
            return _ = [10, 10, 10, 20],
            h = _[0],
            o = _[1],
            c = _[2],
            r = _[3],
            y = 428,
            n = 100,
            $("#contributors ol").remove(),
            a = j(l),
            v = d3.select("#contributors").append("ol").attr("class", "contrib-data capped-cards clearfix"),
            i = d3.max(a,
            function(t) {
                return d3.max(t.weeks,
                function(t) {
                    return t[u]
                })
            }),
            w = d3.time.scale().domain([b, d]).range([0, y]),
            C = d3.scale.linear().domain([0, i]).range([n - r - h, 0]),
            e = d3.svg.area().interpolate("basis").x(function(t) {
                return w(t.date)
            }).y0(function() {
                return n - r - h
            }).y1(function(t) {
                return C(t[u])
            }),
            k = d3.svg.axis().scale(C).orient("left").ticks(2).tickSize( - y).tickPadding(10).tickFormat(d3.formatSymbol),
            p = d3.time.format("%m/%y"),
            x = d3.svg.axis().scale(w).tickFormat(p),
            a[0].weeks.length < 5 && x.ticks(a[0].weeks.length).tickFormat(d3.time.format("%x")),
            $("li.capped-card").remove(),
            f = v.selectAll("li.capped-card").data(a).enter().append("li").attr("class", "capped-card").style("display",
            function(t) {
                return t[u] < 1 ? "none": "block"
            }),
            s = f.append("h3"),
            s.append("img").attr("src",
            function(t) {
                return t.author.avatar
            }).attr("class", "avatar"),
            s.append("span").attr("class", "rank").text(function(t, e) {
                return "#" + (e + 1)
            }),
            s.append("a").attr("class", "aname").attr("href",
            function(t) {
                return "/" + t.author.login
            }).text(function(t) {
                return t.author.login
            }),
            t = s.append("span").attr("class", "ameta"),
            m = $(".graphs").attr("data-repo-url"),
            t.append("span").attr("class", "cmeta").html(function(t) {
                return "<a class='cmt' href='" + m + "/commits?author=" + t.author.login + "'>" + $.commafy(t.c) + " " + $.pluralize(t.c, "commit") + "</a> / <span class='a'>" + $.commafy(t.a) + " ++</span> / <span class='d'>" + $.commafy(t.d) + " --</span>"
            }),
            g = f.append("svg").attr("width", y + (o + c)).attr("height", n + h + r).attr("class", "capped-card-content").append("g").attr("transform", "translate(" + o + "," + h + ")"),
            g.append("g").attr("class", "x axis").attr("transform", "translate(0, " + (n - h - r) + ")").call(x).selectAll(".tick text").style("display",
            function(t, e) {
                return 0 !== e % 2 ? "none": "block"
            }),
            S = g.append("g").attr("class", "y axis").call(k).selectAll(".y.axis g text").attr("dx", y / 2).style("display",
            function(t, e) {
                return 0 === e ? "none": "block"
            }).classed("midlabel", !0),
            g.append("path").attr("d",
            function(t) {
                return e(t.weeks)
            })
        },
        w = function() {
            var e, n;
            return $.support.pjax ? (e = document.location, u = $("input[name=ctype]:checked").prop("value").toLowerCase(), n = "" + e.pathname + "?from=" + t(b) + "&to=" + t(d) + "&type=" + u, window.history.pushState(null, null, n)) : void 0
        },
        f = function() {
            return u !== $(this).val() ? (w(), g(l)) : void 0
        },
        l = p(a),
        g(a)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c, l, u, d;
    l = d3.time.format("%m/%d"),
    i = d3.time.format("%A, %B %d %Y"),
    s = d3.time.format("%-I%p"),
    a = d3.format(","),
    r = {
        top: 20,
        right: 40,
        bottom: 30,
        left: 40
    },
    d = 980 - r.left - r.right,
    n = 150 - r.top - r.bottom,
    t = d3.bisector(function(t) {
        return t.date
    }).left,
    e = function(t) {
        return "<div class='blankslate'> <span class='mega-octicon octicon-graph'></span> <h3>No activity so far this " + t + "</h3> </div>"
    },
    u = function(t) {
        var e;
        return e = 0 > t ? "octicon-arrow-down": t > 0 ? "octicon-arrow-up": "",
        "<span class='totals-num'> <span class='octicon " + e + "'></span> " + a(Math.abs(t)) + " change </span>"
    },
    o = function(t) {
        var e, n;
        return e = 0 > t ? "octicon-arrow-down": t > 0 ? "octicon-arrow-up": "",
        n = 0 > t ? "decrease": "increase",
        "<span class='totals-num'> <span class='octicon " + e + "'></span> " + a(Math.abs(t)) + "% " + n + " </span>"
    },
    c = function(c, l) {
        var h, f, m, p, g, v, y, b, j, w, x, C, k, S, _, T, D, M, P, A, B, L, E, F, I;
        if (l && null == l.error) {
            for (p = l.counts, m = l.summary.columns, C = new Date(1e3 * l.summary.starting), v = new Date(1e3 * l.summary.ending), j = l.summary.model, w = l.summary.period, b = d3.max(d3.merge(d3.values(p)),
            function(t) {
                return t.count
            }), L = 0, F = m.length; F > L; L++) f = m[L],
            $(".js-" + j + "-" + f + " .js-total").text(a(l.summary.totals[f])),
            $(".js-" + j + "-" + f + " .js-changes").append(u(l.summary.total_changes[f])),
            $(".js-" + j + "-" + f + " .js-changes").append(o(l.summary.percent_changes[f]));
            if (0 === d3.values(l.summary.totals).filter(function(t) {
                return 0 !== t
            }).length) return $(this).html(e(w));
            for (_ = d3.tip().attr("class", "svg-tip total-unique").offset([ - 10, 0]).html(function(t) {
                var e, n, r, o, c, u;
                for (r = "", e = function() {
                    switch (w) {
                    case "year":
                        return "Week of " + i(t.date);
                    case "week":
                        return "" + i(t.date) + " starting at " + s(t.date);
                    default:
                        return i(t.date)
                    }
                } (), n = 270 / l.summary.columns.length, u = l.summary.columns, o = 0, c = u.length; c > o; o++) f = u[o],
                r += "<li class='totals " + f + "' style='width:" + n + "px'> <strong>" + a(t[f]) + "</strong> " + f.split("_at")[0] + " </li>";
                return "<span class='title'>" + e + "</span> <ul> " + r + " </ul>"
            }), x = function() {
                var e, n, s, i, r, a, o, c, l, u;
                for (o = {},
                c = D.invert(d3.mouse(this)[0]), r = m[0], a = t(p[r], c, 1), n = p[r][a - 1], s = p[r][a], e = s && c - n.date > s.date - c ? a: a - 1, o.date = p[r][e].date, l = 0, u = m.length; u > l; l++) f = m[l],
                o[f] = p[f][e].count;
                return i = T.selectAll("g.dots circle").filter(function(t) {
                    return t.date === o.date
                }),
                _.show.call(this, o, i[0][0])
            },
            E = 0, I = m.length; I > E; E++) f = m[E],
            p[f].forEach(function(t) {
                return t.date = new Date(1e3 * t.bucket)
            }),
            p[f] = p[f].filter(function(t) {
                return t.date < new Date
            });
            return D = d3.time.scale().range([0, d]),
            P = d3.scale.linear().range([n, 0]),
            A = d3.scale.linear().range([n, 0]),
            k = 1,
            S = function() {
                switch (w) {
                case "year":
                    return d3.time.months;
                case "week":
                    return k = 8,
                    d3.time.hours;
                default:
                    return k = 2,
                    d3.time.days
                }
            } (),
            M = d3.svg.axis().scale(D).tickSize(n + 5).tickPadding(10).ticks(S, k).orient("bottom"),
            B = d3.svg.axis().scale(P).ticks(3).tickFormat(d3.formatSymbol).orient("left"),
            y = d3.svg.line().x(function(t) {
                return D(t.date)
            }).y(function(t) {
                return P(t.count)
            }),
            T = d3.select(this).append("svg").attr("width", d + r.left + r.right).attr("height", n + r.top + r.bottom).attr("class", "vis").append("g").attr("transform", "translate(" + r.left + "," + r.top + ")").call(_),
            D.domain([C, v]),
            P.domain([0, b]),
            T.append("g").attr("class", "x axis").call(M).selectAll("text").attr("text-anchor", "middle"),
            T.append("g").attr("class", "y axis").call(B),
            h = d3.values(p),
            T.selectAll("path.path").data(h).enter().append("path").attr("class",
            function(t) {
                return "path total " + t[0].column
            }).attr("d",
            function(t) {
                return y(t)
            }),
            g = T.selectAll("g.dots").data(h).enter().append("g").attr("class",
            function(t) {
                return "dots totals " + t[0].column
            }),
            g.each(function() {
                var t;
                return t = d3.select(this),
                t.selectAll("circle").data(function(t) {
                    return p[t[0].column]
                }).enter().append("circle").attr("cx",
                function(t) {
                    return D(t.date)
                }).attr("cy",
                function(t) {
                    return P(t.count)
                }).attr("r", 4)
            }),
            B.orient("right"),
            T.append("g").attr("class", "y axis unique").attr("transform", "translate(" + d + ", 0)").call(B),
            T.append("rect").attr("class", "overlay").attr("width", d).attr("height", n).on("mousemove", x).on("mouseout",
            function() {
                return setTimeout(_.hide, 500)
            })
        }
    },
    $(document).on("graph:load", ".js-dashboards-overview-graph", c)
}.call(this),
function() {
    d3.formatSymbol = function(t, e) {
        var n;
        return null == e && (e = !1),
        e && (t = Math.abs(t)),
        1e3 > t ? t: (n = d3.formatPrefix(t), "" + n.scale(t) + n.symbol)
    },
    d3.weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}.call(this),
function() {
    var t, e;
    t = {},
    $.observe(".js-graph", e = function(e) {
        var n, s, i;
        n = $(e),
        (s = n.attr("data-url")) && (n.find("svg").remove(), i = null != t[s] ? t[s] : t[s] = $.ajaxPoll({
            url: s
        }), n.addClass("is-graph-loading"), n.removeClass("is-graph-crunching is-graph-load-error is-graph-empty"), i.progress(function() {
            return n.addClass("is-graph-crunching")
        }), i.always(function() {
            return n.removeClass("is-graph-loading is-graph-crunching")
        }), i.done(function(t) {
            var e, s;
            return 0 === (null != t ? t.length: void 0) || 0 === (null != (e = t[0]) ? null != (s = e.weeks) ? s.length: void 0 : void 0) ? n.addClass("is-graph-empty") : n.trigger("graph:load", [t])
        }), i.fail(function() {
            return n.addClass("is-graph-load-error")
        }))
    })
}.call(this);
var Network = defineNetwork(window.jQuery);
$(function() {
    $("#ng")[0] && new Network("#ng", 920, 600)
}),
function() {
    var t = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    GitHub.ParticipationGraph = function() {
        function e(e) {
            this.onSuccess = t(this.onSuccess, this);
            var n, s, i, r, a, o, c;
            this.el = $(e),
            this.canvas = e.getContext("2d"),
            i = window.devicePixelRatio || 1,
            s = this.canvas.webkitBackingStorePixelRatio || this.canvas.mozBackingStorePixelRatio || this.canvas.msBackingStorePixelRatio || this.canvas.oBackingStorePixelRatio || this.canvas.backingStorePixelRatio || 1,
            o = i / s,
            1 !== o && (c = e.width, r = e.height, e.width = c * o, e.height = r * o, e.style.width = c + "px", e.style.height = r + "px", this.canvas.scale(o, o)),
            n = this.el.data("color-all"),
            a = this.el.data("color-owner"),
            null != n && (this.colors.all = n),
            null != a && (this.colors.owner = a),
            this.barMaxHeight = this.el.height(),
            this.barWidth = (this.el.width() - 52) / 52,
            this.refresh()
        }
        return e.prototype.colors = {
            all: "#cacaca",
            owner: "#336699"
        },
        e.prototype.getUrl = function() {
            return this.el.data("source")
        },
        e.prototype.setData = function(t) {
            var e, n;
            this.data = t,
            (null == (null != (e = this.data) ? e.all: void 0) || null == (null != (n = this.data) ? n.owner: void 0)) && (this.data = null),
            this.scale = this.getScale(this.data)
        },
        e.prototype.getScale = function(t) {
            var e, n, s, i, r;
            if (null != t) {
                for (e = t.all[0], r = t.all, s = 0, i = r.length; i > s; s++) n = r[s],
                n > e && (e = n);
                return e >= this.barMaxHeight ? (this.barMaxHeight - .1) / e: 1
            }
        },
        e.prototype.refresh = function() {
            $.ajax({
                url: this.getUrl(),
                dataType: "json",
                success: this.onSuccess
            })
        },
        e.prototype.onSuccess = function(t) {
            this.setData(t),
            this.draw()
        },
        e.prototype.draw = function() {
            null != this.data && (this.drawCommits(this.data.all, this.colors.all), this.drawCommits(this.data.owner, this.colors.owner))
        },
        e.prototype.drawCommits = function(t, e) {
            var n, s, i, r, a, o, c, l;
            for (i = c = 0, l = t.length; l > c; i = ++c) n = t[i],
            r = this.barWidth,
            s = n * this.scale,
            a = i * (this.barWidth + 1),
            o = this.barMaxHeight - s,
            this.canvas.fillStyle = e,
            this.canvas.fillRect(a, o, r, s)
        },
        e
    } (),
    $.pageUpdate(function() {
        return $(this).find(".participation-graph.disabled").each(function() {
            return $(this).removeClass("disabled"),
            new GitHub.ParticipationGraph($(this).find("canvas")[0])
        })
    })
}.call(this),
function() {
    $(document).on("graph:load", ".js-pulse-authors-graph",
    function(t, e) {
        var n, s, i, r, a, o, c, l, u, d, h, f, m, p, g;
        return n = 15,
        e = e.slice(0, +(n - 1) + 1 || 9e9),
        h = $(this).width(),
        i = $(this).height(),
        g = [20, 0, 10, 20],
        l = g[0],
        c = g[1],
        a = g[2],
        o = g[3],
        f = d3.scale.ordinal().rangeRoundBands([0, h - o - c], .2),
        m = d3.scale.linear().range([i, 0]),
        p = d3.svg.axis().scale(m).orient("left").ticks(3).tickSize( - h + o + c).tickFormat(d3.formatSymbol),
        r = d3.max(e,
        function(t) {
            return t.commits
        }),
        m.domain([0, r]),
        f.domain(d3.range(n)),
        a = f.rangeBand() + a,
        u = d3.tip().attr("class", "svg-tip").offset([ - 10, 0]).html(function(t) {
            var e;
            return "<strong>" + t.commits + "</strong> " + $.pluralize(t.commits, "commit") + " by <strong>" + (null != (e = t.login) ? e: t.name) + "</strong>"
        }),
        d = d3.select(this).append("svg").attr("id", "graph-pulse-authors").attr("height", i + l + a).append("g").attr("transform", "translate(" + o + ", " + l + ")").call(u),
        d.append("g").attr("class", "y axis").call(p),
        s = d.selectAll("g.bar").data(e).enter().append("g").attr("class", "bar").attr("transform",
        function(t, e) {
            return "translate(" + f(e) + ", 0)"
        }),
        s.append("rect").attr("width", f.rangeBand()).attr("height",
        function(t) {
            return i - m(t.commits)
        }).attr("y",
        function(t) {
            return m(t.commits)
        }).on("mouseover", u.show).on("mouseout", u.hide),
        s.append("image").attr("y", i + 5).attr("xlink:href",
        function(t) {
            return t.gravatar
        }).attr("width", f.rangeBand()).attr("height", f.rangeBand()).on("click",
        function(t) {
            return null != t.login ? document.location = "/" + t.login: void 0
        })
    })
}.call(this),
function() {
    $(document).on("graph:load", ".js-graph-punchcard",
    function(t, e) {
        var n, s, i, r, a, o, c, l, u, d, h, f, m, p, g, v, y, b, j, w, x;
        return a = 500,
        b = $(this).width(),
        d = {},
        e.forEach(function(t) {
            var e, n, s;
            return s = d3.weekdays[t[0]],
            e = null != d[s] ? d[s] : d[s] = [],
            n = t[1],
            null == e[n] && (e[n] = 0),
            e[n] += t[2]
        }),
        e = d3.entries(d).reverse(),
        x = [0, 0, 0, 20],
        p = x[0],
        f = x[1],
        m = x[2],
        h = x[3],
        c = 100,
        s = d3.range(7),
        o = d3.range(24),
        u = d3.min(e,
        function(t) {
            return d3.min(t.value)
        }),
        l = d3.max(e,
        function(t) {
            return d3.max(t.value)
        }),
        j = d3.scale.ordinal().domain(o).rangeRoundBands([0, b - c - f - m], .1),
        w = d3.scale.ordinal().domain(s).rangeRoundBands([a - p - h, 0], .1),
        g = d3.scale.sqrt().domain([0, l]).range([0, j.rangeBand() / 2]),
        v = d3.tip().attr("class", "svg-tip").offset([ - 10, 0]).html(function(t) {
            return "<strong>" + t + "</strong> " + $.pluralize(t, "commit")
        }),
        y = d3.select(this).data(e).attr("width", "" + b + "px").append("svg").attr("width", b + (f + m)).attr("height", a + p + h).attr("class", "viz").append("g").attr("transform", "translate(" + f + "," + p + ")").call(v),
        i = y.selectAll("g.day").data(e).enter().append("g").attr("class", "day").attr("transform",
        function(t, e) {
            return "translate(0, " + w(e) + ")"
        }),
        i.append("line").attr("x1", 0).attr("y1", w.rangeBand()).attr("x2", b - f - m).attr("y2", w.rangeBand()).attr("class", "axis"),
        i.append("text").attr("class", "day-name").text(function(t) {
            return t.key
        }).attr("dy", w.rangeBand() / 2),
        y.append("g").selectAll("text.hour").data(o).enter().append("text").attr("text-anchor", "middle").attr("transform",
        function(t, e) {
            return "translate(" + (j(e) + c) + ", " + a + ")"
        }).attr("class", "label").text(function(t) {
            var e;
            return e = t % 12 || 12,
            0 === t || 12 > t ? "" + e + "a": "" + e + "p"
        }),
        r = i.selectAll(".hour").data(function(t) {
            return t.value
        }).enter().append("g").attr("class", "hour").attr("transform",
        function(t, e) {
            return "translate(" + (j(e) + c) + ", 0)"
        }).attr("width", j.rangeBand()),
        r.append("line").attr("x1", 0).attr("y1",
        function(t, e) {
            return w.rangeBand() - (0 === e % 2 ? 15 : 10)
        }).attr("x2", 0).attr("y2", w.rangeBand()).attr("class",
        function(t, e) {
            return 0 === e % 2 ? "axis even": "axis odd"
        }),
        n = r.append("circle").attr("r", 0).attr("cy", w.rangeBand() / 2 - 5).attr("class",
        function() {
            return "day"
        }).on("mouseover", v.show).on("mouseout", v.hide),
        n.transition().attr("r", g)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c;
    a = d3.time.format.utc("%m/%d"),
    n = d3.time.format.utc("%A, %B %d %Y"),
    i = d3.format(","),
    s = {
        top: 20,
        right: 80,
        bottom: 30,
        left: 40
    },
    c = 960 - s.left - s.right,
    e = 150 - s.top - s.bottom,
    o = d3.tip().attr("class", "svg-tip total-unique").offset([ - 10, 0]).html(function(t) {
        return "<span class='title'>" + n(t.date) + "</span> <ul> <li class='totals'><strong>" + i(t.total) + "</strong> views</li ><li class='uniques'><strong>" + i(t.unique) + "</strong> unique visitors</li> </ul>"
    }),
    t = d3.bisector(function(t) {
        return t.date
    }).left,
    r = function(n, r) {
        var l, u, d, h, f, m, p, g, v, y, b, j, w, x, C, k, S, _, T, D, M, P, A, B;
        if (r && null == r.error) {
            for (k = d3.time.scale.utc().range([0, c]), _ = d3.scale.linear().range([e, 0]), T = d3.scale.linear().range([e, 0]), S = d3.svg.axis().scale(k).tickSize(e + 5).tickPadding(10).tickFormat(a).orient("bottom"), D = d3.svg.axis().scale(_).ticks(3).tickFormat(d3.formatSymbol).orient("left"), f = d3.svg.line().x(function(t) {
                return k(t.key)
            }).y(function(t) {
                return _(t.value)
            }), w = d3.select(this).append("svg").attr("width", c + s.left + s.right).attr("height", e + s.top + s.bottom).attr("class", "vis").append("g").attr("transform", "translate(" + s.left + "," + s.top + ")").call(o), l = r.counts.slice(0, 14), l.forEach(function(t) {
                return t.date = new Date(1e3 * (t.bucket + t.tz_seconds))
            }), l.sort(function(t, e) {
                return d3.ascending(t.date, e.date)
            }), p = function() {
                var e, n, s, i, r, a;
                return a = k.invert(d3.mouse(this)[0]),
                r = t(l, a, 1),
                n = l[r - 1],
                s = l[r],
                n && s ? (e = a - n.date > s.date - a ? s: n, i = w.selectAll("g.dots circle").filter(function(t) {
                    return t.key === e.date
                }), o.show.call(this, e, i[0][0])) : void 0
            },
            v = [], j = [], M = 0, P = l.length; P > M; M++) h = l[M],
            v.push({
                key: h.date,
                value: h.total
            }),
            j.push({
                key: h.date,
                value: h.unique
            });
            return m = [v, j],
            A = d3.extent(l,
            function(t) {
                return t.date
            }),
            g = A[0],
            d = A[1],
            B = d3.extent(v,
            function(t) {
                return t.value
            }),
            C = B[0],
            x = B[1],
            y = d3.max(j,
            function(t) {
                return t.value
            }),
            b = y + d3.median(j,
            function(t) {
                return t.value
            }),
            k.domain([g, d]),
            _.domain([0, x]),
            T.domain([0, b]),
            $(".js-views").text(i(r.summary.total)),
            $(".js-uniques").text(i(r.summary.unique)),
            w.append("g").attr("class", "x axis").call(S),
            w.append("g").attr("class", "y axis views").call(D),
            w.selectAll("path.path").data(m).enter().append("path").attr("class",
            function(t, e) {
                return "path " + (0 === e ? "total": "unique")
            }).attr("d",
            function(t, e) {
                return 0 === e ? f(t) : f.y(function(t) {
                    return T(t.value)
                })(t)
            }),
            u = w.selectAll("g.dots").data(m).enter().append("g").attr("class",
            function(t, e) {
                return 0 === e ? "dots totals": "dots uniques"
            }),
            u.each(function(t, e) {
                var n;
                return n = d3.select(this),
                1 === e && (_ = T),
                n.selectAll("circle").data(function(t) {
                    return t
                }).enter().append("circle").attr("cx",
                function(t) {
                    return k(t.key)
                }).attr("cy",
                function(t) {
                    return _(t.value)
                }).attr("r", 4)
            }),
            D.scale(T).orient("right"),
            w.append("g").attr("class", "y axis unique").attr("transform", "translate(" + c + ", 0)").call(D),
            w.append("rect").attr("class", "overlay").attr("width", c).attr("height", e).on("mousemove", p).on("mouseout",
            function() {
                return setTimeout(o.hide, 500)
            })
        }
    },
    $(document).on("graph:load", ".js-traffic-graph", r),
    $(document).on("click", ".js-domain-list",
    function(t) {
        return t.preventDefault(),
        $(".js-top-paths").fadeOut("fast",
        function() {
            return $(".js-top-domains").fadeIn("fast")
        })
    }),
    $(document).on("click", ".js-domain",
    function(t) {
        return t.preventDefault(),
        $.ajax({
            url: $(this).attr("href"),
            beforeSend: function() {
                return $(".js-top-domains").hide(),
                $(".js-spinner").show()
            }
        }).done(function(t) {
            return $(".js-spinner").hide(),
            $(".js-top-paths").html(t).fadeIn("fast")
        })
    })
}.call(this),
function() {
    $(document).on("click", ".dropdown-toggle .js-menu-target",
    function() {
        return $(".dropdown-toggle .js-menu-content").html($(".js-new-dropdown-contents").html())
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    },
    n = [].indexOf ||
    function(t) {
        for (var e = 0,
        n = this.length; n > e; e++) if (e in this && this[e] === t) return e;
        return - 1
    };
    t = function() {
        function t(t) {
            this.input = t,
            this.loadSuggestions = e(this.loadSuggestions, this),
            this.onNavigationOpen = e(this.onNavigationOpen, this),
            this.onNavigationKeyDown = e(this.onNavigationKeyDown, this),
            this.onKeyUp = e(this.onKeyUp, this),
            this.deactivate = e(this.deactivate, this),
            this.activate = e(this.activate, this),
            this.container = e(this.container, this),
            this.list = e(this.list, this),
            $(this.input).attr("data-member-adder-activated") || ($(this.input).attr("data-member-adder-activated", !0), $(this.input).on("focusout:delayed.member-adder", this.deactivate), $(this.input).on("focusin:delayed.member-adder", this.activate), $(this.input).on("keyup.member-adder", this.onKeyUp), $(this.input).on("throttled:input.member-adder", this.loadSuggestions), this.spinner = document.getElementById($(this.input).attr("data-spinner")), this.container().on("navigation:keydown.member-adder", "[data-value]", this.onNavigationKeyDown), this.container().on("navigation:open.member-adder", "[data-value]", this.onNavigationOpen), this.sudo = $(this.input).attr("data-sudo-required"), this.added = {})
        }
        return t.prototype.list = function() {
            return this._list || (this._list = $(document.getElementById($(this.input).attr("data-member-list"))))
        },
        t.prototype.container = function() {
            return this._container || (this._container = $(document.getElementById($(this.input).attr("data-member-adder"))))
        },
        t.prototype.activate = function() {
            this.container().is(".active") || this.query && (this.container().addClass("active"), $(this.input).addClass("js-navigation-enable"), this.container().navigation("push"), this.container().navigation("focus"))
        },
        t.prototype.deactivate = function() {
            this.container().removeClass("active"),
            this.container().find(".suggestions").hide(),
            $(this.input).removeClass("js-navigation-enable"),
            this.container().navigation("pop")
        },
        t.prototype.onKeyUp = function() {
            var t;
            return t = $(this.input).val(),
            t !== this.query ? (this.query = t) ? (this.search(t) ? this.activate() : this.deactivate(), this.query) : (this.query = null, this.deactivate(), void 0) : void 0
        },
        t.prototype.onNavigationKeyDown = function(t) {
            switch (t.hotkey) {
            case "tab":
                return this.onNavigationOpen(t),
                !1;
            case "esc":
                return this.deactivate(),
                !1
            }
        },
        t.prototype.onNavigationOpen = function(t) {
            var e, n, s, i;
            return s = $(t.target).attr("data-value"),
            this.input.value = "",
            n = this.container().attr("data-add-url"),
            null != (i = this.ajax) && i.abort(),
            e = this.sudo ? GitHub.withSudo: function(t) {
                return t()
            },
            e(function(t) {
                return function() {
                    return t.startSpinner(),
                    n ? $.ajax({
                        url: n,
                        type: "post",
                        data: {
                            member: s
                        },
                        complete: function(e) {
                            return t.stopSpinner(),
                            200 === e.status ? (t.list().prepend(e.responseText), t.list().pageUpdate(), t.list().trigger("member-adder:added", s), t.added[s] = !0, t.deactivate()) : t.list().trigger("member-adder:error", [s, e])
                        }
                    }) : (t.stopSpinner(), 0 === t.list().find("li[data-value='" + s + "']").length && (t.list().prepend(t.container().find("li[data-value='" + s + "']").clone()), t.list().pageUpdate(), t.list().trigger("member-adder:added", s))),
                    t.deactivate(),
                    t.input.focus()
                }
            } (this)),
            this.deactivate(),
            this.input.focus(),
            !1
        },
        t.prototype.startSpinner = function() {
            return this.spinner && $(this.spinner).length ? $(this.spinner).removeClass("hidden") : void 0
        },
        t.prototype.stopSpinner = function() {
            return this.spinner && $(this.spinner).length ? $(this.spinner).addClass("hidden") : void 0
        },
        t.prototype.search = function(t) {
            var e, s, i, r, a;
            return i = this.container().find("ul"),
            i[0] ? (e = this.container().find(".js-no-results"), e.addClass("hidden"), r = n.call(t.slice(1), "@") >= 0, !r && (s = i.data("fuzzy-sort-items")) && i.data("fuzzy-sort-items", s.filter(function() {
                return $(this).attr("data-value") && !(n.call($(this).attr("data-value"), "@") >= 0)
            })), a = i.fuzzyFilterSortList(t.replace(/^@/, ""), {
                limit: 5,
                text: function(t) {
                    return t.getAttribute("data-value")
                }
            }), r && i.find("li:not(:first-child)").remove(), a > 0 ? (i.show(), this.container().navigation("focus"), !0) : (e.addClass("active"), !1)) : void 0
        },
        t.prototype.loadSuggestions = function() {
            var t, e;
            if ((t = this.query) && (e = this.container().attr("data-search-url")) && !this.ajax) return this.startSpinner(),
            this.ajax = $.ajax({
                url: e,
                data: {
                    query: t
                },
                complete: function(t) {
                    return function() {
                        return t.ajax = null,
                        t.stopSpinner()
                    }
                } (this),
                success: function(t) {
                    return function(e) {
                        var n, s, i, r, a, o, c, l, u, d;
                        if (n = $($.parseHTML(e)), a = n.find("li"), a.length || t.container().find("li").visible().length || (t.activate(), $(".js-no-results").removeClass("hidden")), a.length) {
                            for (c = t.container().find("ul"), s = c.data("fuzzy-sort-items"), o = {},
                            r = [], d = s.toArray().concat(a.toArray()), l = 0, u = d.length; u > l; l++) i = d[l],
                            o[i.textContent] || t.added[$(i).attr("data-value")] || r.push(i),
                            o[i.textContent] = !0;
                            return c.data("fuzzy-sort-items", $(r)),
                            t.query = null,
                            t.onKeyUp()
                        }
                    }
                } (this)
            })
        },
        t
    } (),
    $.observe("input[data-member-adder]",
    function() {
        new t(this)
    })
}.call(this),
function() {
    var t, e;
    $(document).on("click", ".js-org-billing-plans .js-choose-plan",
    function() {
        return t($(this).closest(".js-plan-row")),
        !1
    }),
    t = function(t) {
        var n, s, i, r;
        return i = t.attr("data-name"),
        s = parseInt(t.attr("data-cost"), 10),
        n = parseInt(null != (r = t.attr("data-balance")) ? r: "0", 10),
        $(".js-org-billing-plans").find(".js-plan-row, .js-choose-plan").removeClass("selected"),
        t.find(".js-choose-plan").addClass("selected"),
        t.addClass("selected"),
        $(".js-plan").val(i),
        0 === s && 0 === n ? Billing.displayCreditCardFields(!1) : (Billing.displayCreditCardFields(!0), null != t.attr("data-balance") ? e(i) : void 0)
    },
    e = function(t) {
        return $(".js-plan-change-message").addClass("is-hidden"),
        $('.js-plan-change-message[data-name="' + t + '"]').removeClass("is-hidden")
    },
    $(function() {
        return Billing.displayCreditCardFields(!1),
        $(".selected .js-choose-plan").click()
    })
}.call(this),
function() {
    var t, e;
    t = function() {
        var t, n, s, i, r;
        return i = [],
        t = $(".js-advanced-search-input").val(),
        r = {
            Repositories: 0,
            Users: 0,
            Code: 0
        },
        i = e($("input[type=text].js-advanced-search-prefix, select.js-advanced-search-prefix"),
        function(t, e, n) {
            return "" === t ? "": ("" !== e && r[n]++, "" !== e ? "" + t + e: void 0)
        }),
        $.merge(i, e($("input[type=checkbox].js-advanced-search-prefix"),
        function(t, e, n) {
            var s;
            return s = $(this).prop("checked"),
            s !== !1 && r[n]++,
            s !== !1 ? "" + t + s: void 0
        })),
        n = function(t) {
            return t.Users > t.Code && t.Users > t.Repositories ? "Users": t.Code > t.Users && t.Code > t.Repositories ? "Code": "Repositories"
        },
        s = $.trim(i.join(" ")),
        $(".js-type-value").val(n(r)),
        $(".js-search-query").val($.trim("" + t + " " + s)),
        $(".js-advanced-query").empty(),
        $(".js-advanced-query").text("" + s),
        $(".js-advanced-query").prepend($("<span>").text($.trim(t)), " ")
    },
    e = function(t, e) {
        return $.map(t,
        function(t) {
            var n, s, i, r;
            return i = $.trim($(t).val()),
            n = $(t).attr("data-search-prefix"),
            s = $(t).attr("data-search-type"),
            r = function(t) {
                return - 1 !== t.search(/\s/g) ? '"' + t + '"': t
            },
            "" === n ? e.call(t, n, i, s) : -1 !== i.search(/\,/g) && "location" !== n ? i.split(/\,/).map(function(i) {
                return e.call(t, n, r($.trim(i)), s)
            }) : e.call(t, n, r(i), s)
        })
    },
    $(document).onFocusedInput(".js-advanced-search-prefix",
    function() {
        return function() {
            return t()
        }
    }),
    $(document).on("change", ".js-advanced-search-prefix", t),
    $(document).on("focusin", ".js-advanced-search-input",
    function() {
        return $(this).closest(".js-advanced-search-label").addClass("focus")
    }),
    $(document).on("focusout", ".js-advanced-search-input",
    function() {
        return $(this).closest(".js-advanced-search-label").removeClass("focus")
    }),
    $(document).on("click", ".js-see-all-search-cheatsheet",
    function() {
        return $(".js-more-cheatsheet-info").removeClass("hidden"),
        !1
    }),
    $(function() {
        return $(".js-advanced-search-input").length ? t() : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".js-add-billing-manager-button",
    function(t) {
        return $(t.target).toggleClass("selected"),
        $(".js-add-billing-manager-form").toggle(),
        $(".js-add-billing-manager-form input").focus(),
        !1
    }),
    $(document).on("member-adder:error", ".js-billing-managers",
    function() {
        return $(".js-alert").removeClass("hidden"),
        $(".js-add-billing-manager-form").on("input.billing-manager",
        function() {
            return $(".js-alert").addClass("hidden"),
            $(this).off(".billing-manager")
        })
    }),
    $(document).on("member-adder:added", ".js-billing-managers",
    function() {
        return $(".js-add-billing-manager-button").click()
    })
}.call(this),
function() {
    var t, e, n, s, i;
    t = function(t) {
        return Math.floor( + new Date - +t)
    },
    i = function() {
        var t, e;
        for (e = [], s = t = 1; 10 >= t; s = ++t) e.push("heat" + s);
        return e
    } (),
    e = d3.scale.quantile().range(i),
    $.pageUpdate(n = function() {
        var n, s, i, r, a, o, c, l, u, d, h;
        for (d = $(this).find(".js-blame-heat"), o = 0, l = d.length; l > o; o++) for (a = d[o], r = moment($(a).attr("data-repo-created")), e.domain([0, t(r)]), h = $(a).find(".js-line-age"), c = 0, u = h.length; u > c; c++) i = h[c],
        i = $(i),
        n = moment(i.attr("data-date")),
        s = e(t(n)),
        i.addClass(s)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o;
    n = function(t) {
        var e, n, s, i, r;
        if (n = t.match(/\#?(?:L|-)(\d+)/gi)) {
            for (r = [], s = 0, i = n.length; i > s; s++) e = n[s],
            r.push(parseInt(e.replace(/\D/g, "")));
            return r
        }
        return []
    },
    t = function(t) {
        switch (t.sort(a), t.length) {
        case 1:
            return "#L" + t[0];
        case 2:
            return "#L" + t[0] + "-L" + t[1];
        default:
            return "#"
        }
    },
    a = function(t, e) {
        return t - e
    },
    r = !1,
    e = function(t) {
        var e, n, s;
        if (n = $(".line, .line-data"), n.length) {
            if (n.css("background-color", ""), 1 === t.length) return $("#LC" + t[0]).css("background-color", "#ffc");
            if (t.length > 1) {
                for (e = t[0], s = []; e <= t[1];) $("#LC" + e).css("background-color", "#ffc"),
                s.push(e++);
                return s
            }
        }
    },
    i = function(t) {
        var s;
        return null == t && (t = n(window.location.hash)),
        e(t),
        !r && (s = $("#LC" + t[0])).length && $(window).scrollTop(s.offset().top - .33 * $(window).height()),
        r = !1
    },
    o = function(t, e) {
        return null == e && (e = window.location.hash),
        t.each(function() {
            return this.hash = e
        })
    },
    $.hashChange(function() {
        return $(".line, .line-data").length ? (setTimeout(i, 0), o($(".js-update-url-with-hash"))) : void 0
    }),
    s = function(t) {
        var e, n;
        return r = !0,
        e = null != (n = $(window).scrollTop()) ? n: 0,
        t(),
        $(window).scrollTop(e)
    },
    $(document).on("mousedown", ".line-number, .blob-line-nums span[rel], .csv-row-num",
    function(e) {
        var i, r;
        return r = $(this).hasClass("csv-row-num") ? n($(this).find("span").first().attr("id")) : n($(this).attr("rel")),
        e.shiftKey && (i = n(window.location.hash), r.unshift(i[0])),
        s(function() {
            return window.location.hash = t(r)
        }),
        !1
    }),
    $(document).on("submit", ".js-jump-to-line-form",
    function() {
        var t, e;
        return t = $(this).find(".js-jump-to-line-field")[0],
        (e = t.value.replace(/[^\d\-]/g, "")) && (window.location.hash = "L" + e),
        $(document).trigger("close.facebox"),
        !1
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c;
    i = function() {
        var t, e, n, s, i, r, a, o, c;
        return e = $(".js-blob-form"),
        t = e.find(".js-blob-filename"),
        a = !t[0] || t.val() !== t.attr("data-default-value"),
        t[0] && (a = a && "." !== t.val() && ".." !== t.val() && ".git" !== t.val() && !t.val().match(/^\s+$/)),
        o = e.find(".js-check-for-fork").is($.visible),
        r = $(".js-blob-contents")[0],
        s = r.value !== r.defaultValue,
        n = s || $(r).attr("data-allow-unchanged") || $(r).attr("data-new-filename"),
        i = "" === r.value,
        e.find(".js-blob-submit").prop("disabled", !a || o || !n || i),
        c = s || $(r).attr("data-allow-unchanged"),
        e.find(".js-blob-contents-changed").val(c)
    },
    $.pageUpdate(function() {
        var t;
        if (t = $(this).find(".js-blob-contents")[0]) return i()
    }),
    $(document).on("change", ".js-blob-contents",
    function() {
        return r($(".js-blob-filename")),
        i()
    }),
    $(document).on("click", ".js-new-blob-submit",
    function() {
        return $(this).closest("form.js-new-blob-form").submit()
    }),
    $(document).onFocusedInput(".js-blob-filename",
    function() {
        return function() {
            return $(".js-blob-contents").attr("data-filename", $(this).val()),
            s($(this).val()),
            r($(this))
        }
    }),
    $(document).onFocusedInput(".js-breadcrumb-nav",
    function() {
        return function() {
            return c($(this)),
            r($(this))
        }
    }),
    $(document).onFocusedKeydown(".js-breadcrumb-nav",
    function() {
        return function(t) {
            var e, s, i;
            return s = $(this).caretSelection(),
            i = [0, 0],
            e = 0 === $(s).not(i).length && 0 === $(i).not(s).length,
            e && 8 === t.keyCode && 1 !== $(this).parent().children(".separator").size() && (n($(this), !0), t.preventDefault()),
            r($(this))
        }
    }),
    r = function(t) {
        return null != t[0] && (o(t), a(t)),
        i()
    },
    c = function(t) {
        var s, i, r, a, o, c;
        for (c = []; t.val().split("/").length > 1;) s = t.val(),
        r = s.split("/"),
        i = r[0],
        o = r.slice(1).join("/"),
        "" === i || "." === i || ".git" === i ? (t.val(o), a = function() {
            return t.caret(0)
        },
        c.push(window.setTimeout(a, 1))) : ".." === i ? c.push(n(t)) : c.push(e(t, i, o));
        return c
    },
    s = function(t) {
        var e, n;
        return e = $(".js-gitignore-template"),
        n = $(".js-license-template"),
        /^(.+\/)?\.gitignore$/.test(t) ? e.addClass("is-visible") : /^(.+\/)?(licen[sc]e|copying)($|\.)/i.test(t) ? n.addClass("is-visible") : (e.removeClass("is-visible"), n.removeClass("is-visible"))
    },
    a = function(t) {
        var e, n, s, i, r, a, o, c, l, u, d, h;
        return s = t.closest("form"),
        n = $(".js-blob-contents"),
        e = s.find(".js-new-blob-commit-summary"),
        o = t.val() ? "Create " + t.val() : "Create new file",
        d = n.attr("data-old-filename"),
        c = $(".js-new-filename-field").val(),
        n.removeAttr("data-new-filename"),
        o = d.length && c !== d && null != t[0] ? (n.attr("data-new-filename", "true"), r = n[0].value !== n[0].defaultValue, i = r ? "Update and rename": "Rename", t.val().length && c.length ? (h = d.split("/"), l = c.split("/"), u = !0, a = h.length - 1, h.forEach(function(t, e) {
            return e !== a && t !== l[e] ? u = !1 : void 0
        }), h.length === l.length && u ? "" + i + " " + h[a] + " to " + l[a] : "" + i + " " + d + " to " + c) : "" + i + " " + d) : d.length && c === d ? "Update " + t.val() : o,
        e.attr("placeholder", o),
        $(".js-commit-message-fallback").val(o)
    },
    o = function(t) {
        var e, n;
        return e = $(".breadcrumb").children("[itemscope]"),
        n = "",
        e.each(function() {
            var t;
            return t = $(this),
            n = n + t.text() + "/"
        }),
        n += t.val(),
        $(".js-new-filename-field").val(n)
    },
    n = function(t, e) {
        var n, i;
        return null == e && (e = !1),
        e || t.val(t.val().replace("../", "")),
        i = function() {
            return t.caret(0)
        },
        1 !== t.parent().children(".separator").size() && (t.prev().remove(), n = t.prev().children().children().html(), t.prev().remove(), e && (t.val("" + n + t.val()), i = function() {
            return e ? t.caret(n.length) : void 0
        })),
        s(t.val()),
        window.setTimeout(i, 1)
    },
    e = function(t, e, n) {
        var i, r, a, o, c, l, u;
        return null == n && (n = ""),
        e = e.replace(/[^-.a-z_0-9]+/gi, "-"),
        e = e.replace(/^-+|-+$/g, ""),
        e.length > 0 && (u = t.parent().children(".js-repo-root, [itemtype]").children("a").last().attr("href"), u || (i = t.parent().children(".js-repo-root, [itemtype]").children("span").children("a").last(), r = i.attr("data-branch"), c = i.attr("href"), u = "" + c + "/tree/" + r), a = $(".js-crumb-template").clone().removeClass("js-crumb-template"), a.find("a[itemscope]").attr("href", "" + u + "/" + e), a.find("span").text(e), o = $(".js-crumb-separator").clone().removeClass("js-crumb-separator"), t.before(a, o)),
        t.val(n),
        s(t.val()),
        l = function() {
            return t.caret(0)
        },
        window.setTimeout(l, 1)
    },
    $(document).onFocusedInput(".js-new-blob-commit-summary",
    function() {
        var t;
        return t = $(this).closest(".js-file-commit-form"),
        function() {
            return t.toggleClass("is-too-long-error", $(this).val().length > 50)
        }
    }),
    t = function(t) {
        return t.data("checking-for-fork") ? void 0 : (i(), $.smartPoller(function(e) {
            return $.ajax({
                url: t.attr("data-check-url"),
                success: function() {
                    return t.hide(),
                    i()
                },
                error: function(n) {
                    return 404 === n.status ? e() : t.html("<img src='/images/modules/ajax/error.png'>\nSomething went wrong. Please fork the project, then try from your fork.")
                }
            })
        }), t.data("checking-for-fork", !0))
    },
    $.pageUpdate(function() {
        var e, n, s, i;
        for (i = $(".js-check-for-fork"), n = 0, s = i.length; s > n; n++) e = i[n],
        t($(e))
    }),
    $(document).on("change", ".js-gitignore-template input[type=radio]",
    function() {
        return $.ajax({
            type: "GET",
            url: $(this).attr("data-template-url"),
            success: function(t) {
                return editor.setCode(t)
            }
        })
    }),
    $(document).on("change", ".js-license-template input[type=radio]",
    function() {
        var t;
        return t = $(this).attr("data-template-contents"),
        editor.setCode(t)
    }),
    $(document).onFocusedKeydown(".js-new-blob-commit-description",
    function() {
        return function(t) {
            return "ctrl+enter" === t.hotkey || "meta+enter" === t.hotkey ? ($(this).closest("form").submit(), !1) : void 0
        }
    })
}.call(this),
function() {
    $(document).on("ajaxSend", ".js-branch-delete",
    function() {
        return $(this).addClass("disabled"),
        $(this).closest(".actions").find(".spinner").show()
    }),
    $(document).on("ajaxSuccess", ".js-branch-delete",
    function() {
        return $(this).closest("tr").fadeOut(),
        !1
    }),
    $(document).on("ajaxError", ".js-branch-delete",
    function() {
        return $(this).closest(".actions").find(".spinner").hide(),
        $(this).html("Couldn't delete!"),
        !1
    }),
    $(function() {
        var t, e, n, s;
        return e = 2,
        t = 7,
        s = 30,
        n = 1e4,
        $(".diverge-widget").each(function() {
            var n, i, r;
            return n = $(this),
            i = new Date(n.attr("last-updated")),
            r = (new Date - i) / 1e3 / 3600 / 24,
            e >= r ? n.addClass("hot") : t >= r ? n.addClass("fresh") : s >= r ? n.addClass("stale") : n.addClass("old")
        })
    })
}.call(this),
function() {
    $.pageUpdate(function() {
        var t, e;
        if ((t = document.getElementById("diff-comment-data")) && !$(t).data("commit-inline-comments-rendered")) return e = {},
        $(".diff-view > .file > .meta").each(function() {
            return e[$(this).attr("data-path")] = this
        }),
        $("#diff-comment-data > table").each(function() {
            var t, n, s, i;
            return n = $(this).attr("data-path"),
            s = $(this).attr("data-position"),
            t = $(e[n]).closest(".file"),
            i = t.find(".data table tr[data-position='" + s + "']"),
            i.after($(this).children("tbody").children("tr").detach()),
            t.addClass("has-inline-notes show-inline-notes")
        }),
        $("#diff-comment-data > div").each(function() {
            var t;
            return t = $(this).attr("data-path"),
            $(e[t]).closest(".file").find(".file-comments-place-holder").replaceWith($(this).detach())
        }),
        $(t).data("commit-inline-comments-rendered", !0)
    }),
    $(document).on("change", ".js-show-inline-comments-toggle",
    function() {
        return $(this).closest(".file").toggleClass("show-inline-notes", this.checked)
    }),
    $(document).on("keyup",
    function(t) {
        var e;
        return "i" === t.hotkey && t.target === document.body ? (e = 0 === $(".js-show-inline-comments-toggle:not(:checked)").length, $(".js-show-inline-comments-toggle").prop("checked", !e).trigger("change")) : void 0
    }),
    $(document).on("change", "#js-inline-comments-toggle",
    function() {
        return $("#comments").toggleClass("only-commit-comments", !this.checked)
    }),
    $(document).on("click", ".linkable-line-number",
    function() {
        return document.location.hash = this.id,
        !1
    }),
    $(document).on("click", ".js-tag-list-toggle",
    function() {
        var t;
        return t = $(this),
        t.closest(".tag-list").find("li").show(),
        t.hide(),
        !1
    })
}.call(this),
function() {
    $(document).on("navigation:keyopen", ".commit-group-item",
    function() {
        return $(this).find(".commit-title > a").first().click(),
        !1
    }),
    $(document).on("navigation:keydown", ".commit-group-item",
    function(t) {
        return "c" === t.hotkey ? ($(this).find(".commit-title > a").first().click(), !1) : void 0
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    $(document).on("click", ".js-compare-tabs a",
    function() {
        return $(this).closest(".js-compare-tabs").find("a").removeClass("selected"),
        $(this).addClass("selected"),
        $("#commits_bucket, #files_bucket, #commit_comments_bucket").hide(),
        $(this.hash).show(),
        !1
    }),
    $.hashChange(function() {
        return $(this).closest("#files_bucket")[0] && !$(this).is($.visible) ? $('a.tabnav-tab[href="#files_bucket"]').click() : void 0
    }),
    $(document).on("click", ".js-cross-repo a",
    function(t) {
        return t.preventDefault(),
        $(this).closest(".js-range-editor").addClass("is-cross-repo")
    }),
    $(document).on("click", ".js-expand-range-editor",
    function() {
        var t;
        return t = $(this).closest(".js-range-editor"),
        t.removeClass("is-collapsed").addClass("is-expanded")
    }),
    $(document).on("click", ".js-collapse-range-editor",
    function() {
        var t;
        return t = $(this).closest(".js-range-editor"),
        t.addClass("is-collapsed").removeClass("is-expanded")
    }),
    t = function() {
        function t(t) {
            this.onCommitishSelect = e(this.onCommitishSelect, this),
            this.$container = $(t),
            "yes" !== this.$container.attr("data-range-editor-activated") && (this.$form = $("#js-compare-body-form"), this.$suggesters = this.$container.find(".js-select-menu"), this.urlTemplate = this.$container.attr("data-url-template"), this.currentRepo = this.$container.attr("data-current-repository"), this.base = this.$suggesters.filter('[data-type="base"]').attr("data-initial-value"), this.head = this.$suggesters.filter('[data-type="head"]').attr("data-initial-value"), this.baseFork = this.$suggesters.filter('[data-type="base-fork"]').attr("data-initial-value"), this.headFork = this.$suggesters.filter('[data-type="head-fork"]').attr("data-initial-value"), this.discussionDrafted = $(".js-compare-body-draft").length > 0, this.$suggesters.on("navigation:open.range-editor", ".js-navigation-item", this.onCommitishSelect), this.$form.on("change", "input, textarea",
            function(t) {
                return function() {
                    return t.discussionDrafted = !0
                }
            } (this)), this.$container.attr("data-range-editor-activated", "yes"))
        }
        return t.prototype.teardown = function() {
            return this.$suggesters.off(".range-editor"),
            this.$container.attr("data-range-editor-activated", null)
        },
        t.prototype.onCommitishSelect = function(t) {
            var e, n;
            switch (n = $.trim($(t.target).text()), e = $(t.target).closest(".js-select-menu").attr("data-type")) {
            case "base":
                this.base = n;
                break;
            case "head":
                this.head = n;
                break;
            case "base-fork":
                this.baseFork = n;
                break;
            case "head-fork":
                this.headFork = n
            }
            return this.updateDiff()
        },
        t.prototype.updateDiff = function() {
            var t, e, n, s, i;
            return t = encodeURIComponent(this.base),
            n = encodeURIComponent(this.head),
            this.currentRepo !== this.baseFork && (t = "" + this.baseFork.replace(/\/(.+)/, "") + ":" + t),
            this.currentRepo !== this.headFork && (n = "" + this.headFork.replace(/\/(.+)/, "") + ":" + n),
            i = this.urlTemplate.replace("{{head}}", n).replace("{{base}}", t),
            s = {
                url: i,
                container: this.$container.closest("[data-pjax-container]")[0]
            },
            this.discussionDrafted && this.$form.hasDirtyFields() && (e = {
                type: "POST",
                data: this.$form.serializeArray()
            },
            s = $.extend({},
            s, e)),
            $.pjax(s)
        },
        t
    } (),
    $.pageUpdate(function() {
        return $(".js-commitish-range-editor").each(function() {
            return new t(this)
        })
    })
}.call(this),
function() {
    $(document).on("focusin", ".js-contact-documentation-suggestions",
    function() {
        return $(this).data("quicksearch-installed") ? void 0 : ($(this).quicksearch({
            url: $(this).attr("data-quicksearch-url"),
            results: $(this).closest("form").find(".documentation-results")
        }), $(this).data("quicksearch-installed", !0))
    }),
    $(function() {
        return $(".js-contact-javascript-flag").val("true")
    })
}.call(this),
function() {
    var t;
    t = function(t) {
        var e, n, s, i, r, a;
        for (t = t.toLowerCase(), e = $(".js-csv-data tbody tr"), a = [], i = 0, r = e.length; r > i; i++) n = e[i],
        s = $(n).text().toLowerCase(),
        -1 === s.indexOf(t) ? a.push($(n).hide()) : a.push($(n).show());
        return a
    },
    $(document).on("keyup", ".js-csv-filter-field",
    function(e) {
        var n;
        return n = e.target.value,
        null != n && t(n),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-entity-tab",
    function(t) {
        var e, n, s, i, r;
        if (t.preventDefault(), 1 === t.which && !t.metaKey && !t.ctrlKey) {
            for (e = $("#" + $(this).attr("data-container-id")), r = $(".js-entity-tab.selected"), s = 0, i = r.length; i > s; s++) n = r[s],
            $(n).removeClass("selected"),
            $("#" + $(n).attr("data-container-id")).removeClass("is-visible");
            return e.addClass("is-visible"),
            $(this).addClass("selected")
        }
    })
}.call(this),
function() {
    $(document).on("mousedown", ".diff-line-code",
    function() {
        var t;
        return t = $(this).closest(".file-diff"),
        t.addClass("hide-line-numbers"),
        t.hasClass("line-number-attrs") || (t.addClass("line-number-attrs"), t.find(".diff-line-num").each(function() {
            var t;
            return t = $(this),
            t.hasClass("expandable-line-num") ? void 0 : t.attr("data-line-number", $.trim(t.text()))
        })),
        $(document).one("mouseup",
        function() {
            return window.getSelection().toString() ? void 0 : t.removeClass("hide-line-numbers")
        })
    })
}.call(this),
function() {
    $(document).on("focusin", ".js-url-field",
    function() {
        var t;
        return t = this,
        setTimeout(function() {
            return $(t).select()
        },
        0)
    })
}.call(this),
function() {
    var t;
    t = function(t) {
        var e, n;
        return e = $(t),
        n = e.is(".is-autocheck-successful"),
        e.closest("form").find("button.primary").prop("disabled", !n),
        n
    },
    $(function() {
        return $(document.body).is(".page-new-discussion-list") ? t($("#discussion_list_name")) : void 0
    }),
    $(document).on("autocheck:send", "#discussion_list_name",
    function(t, e) {
        var n, s, i;
        return n = $(this),
        i = n.closest("form").find("input[name=owner]:checked").val(),
        s = "" + i + ":" + e.data.value,
        n.data("autocheck-last-value") !== s ? (e.data.owner = i, n.data("autocheck-last-value", s), !0) : !1
    }),
    $(document).on("change", ".new-discussion-list input[name=owner]",
    function() {
        $(this).closest("form").find("input[data-autocheck-url]").trigger("change")
    }),
    $(document).on("autocheck:success", "#discussion_list_name",
    function(t, e) {
        var n, s, i;
        return s = $(this).val(),
        s && s !== e.name ? (n = $(this).closest("dl.form"), n.addClass("warn"), i = $("<dd>").addClass("warning").text("Will be created as " + e.name), n.append(i)) : void 0
    }),
    $(document).on("autocheck:complete", "#discussion_list_name",
    function() {
        t(this)
    })
}.call(this),
function() {
    var t;
    $(document).on("navigation:keydown", ".js-discussion-list-container .js-navigation-item",
    function(t) {
        return "x" === t.hotkey ? $(this).find(".js-discussion-list-checkbox").click().trigger("change") : void 0
    }),
    $(document).on("change", ".js-discussion-list-container .js-discussion-list-checkbox",
    function() {
        return $(this).closest(".js-discussion").toggleClass("is-selected", $(this).prop("checked"))
    }),
    $(document).on("change", ".js-discussions-bulk-actions .js-discussion-list-checkbox",
    function() {
        return $(this).closest(".js-discussions-container").find(".js-discussion-list-container .js-discussion-list-checkbox").prop("checked", $(this).prop("checked"))
    }),
    $(document).on("click", ".js-discussions-bulk-actions .js-mass-assign-button",
    function(t) {
        var e, n, s;
        return n = $(this).closest(".js-discussions-container").find(".js-discussion-list-container .js-discussion-list-checkbox"),
        s = function() {
            var t, s, i;
            for (i = [], t = 0, s = n.length; s > t; t++) e = n[t],
            e.checked && i.push(e.value);
            return i
        } (),
        s.length && $.ajax({
            type: "PUT",
            url: $(this).attr("data-url"),
            data: {
                discussions: s
            },
            success: function() {
                return window.location.reload()
            }
        }),
        t.preventDefault(),
        !1
    }),
    $.observe(".js-discussions-container", t = function(t) {
        $(t).selectableList(".js-discussion-list-container", {
            wrapperSelector: ".js-list-browser-item.selectable",
            itemParentSelector: "",
            enableShiftSelect: !0,
            ignoreLinks: !0
        })
    })
}.call(this),
function() {
    $(document).on("click", ".js-zen-mode",
    function() {
        return $(document.body).hasClass("zen") ? ($(document.body).removeClass("zen"), $(document).off("keydown.zenMode")) : ($(document.body).addClass("zen"), $(document).on("keydown.zenMode",
        function(t) {
            return "esc" === t.hotkey ? ($(document.body).removeClass("zen"), !1) : void 0
        })),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-events-pagination",
    function() {
        var t, e;
        return e = $(this).parent(".ajax_paginate"),
        t = e.parent(),
        e.hasClass("loading") ? !1 : (e.addClass("loading"), $.ajax({
            url: $(this).attr("href"),
            complete: function() {
                return e.removeClass("loading")
            },
            success: function(n) {
                return e.replaceWith(n),
                t.pageUpdate()
            }
        }), !1)
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c;
    a = function(t, e) {
        return t.length ? parseInt(t.attr(e), 10) : -1
    },
    c = function(t, e) {
        var n, s, i;
        return s = t.offset().top,
        i = $(document).scrollTop(),
        e(),
        n = Math.max(t.offset().top - s, 0),
        $(document).scrollTop(i + n)
    },
    r = function(t) {
        var e, n, s, i;
        return n = $(window).scrollTop(),
        e = n + $(window).height(),
        i = t.offset().top,
        s = i + t.height(),
        e >= s && i >= n
    },
    o = function(t) {
        var e, n;
        return e = t.match(/\#(diff\-[a-f0-9]+)[L|R](\d+)$/i),
        null !== e && 3 === e.length ? e: (n = t.match(/\#(discussion\-diff\-[0-9]+)[L|R](\d+)$/i), null !== n && 3 === n.length ? n: null)
    },
    t = function(t, e, n, a, o, l, u, d, h) {
        var f;
        return null == h && (h = {}),
        f = $.extend({
            prev_line_num_left: n,
            prev_line_num_right: o,
            next_line_num_left: a,
            next_line_num_right: l
        },
        h),
        $.ajax({
            context: e,
            url: t + "?" + $.param(f),
            cache: !1,
            success: function(t) {
                var n, a, o, l;
                return a = e.next(),
                a.length ? (c(a,
                function() {
                    return e.replaceWith(t)
                }), a.parent().pageUpdate()) : e.replaceContent(t),
                l = u.slice(1),
                n = $(document.getElementById(l)),
                n.length ? (r(n) || $(window).scrollTop(n.offset().top), o = n.parents("tr"), i(o)) : d ? s(u, !1) : void 0
            }
        })
    },
    i = function(t) {
        return t.addClass("highlight"),
        setTimeout(function() {
            return t.removeClass("highlight")
        },
        800)
    },
    e = function(e, n, s, i, r) {
        var o, c, l, u, d, h, f, m, p, g, v, $, y, b, j;
        return o = e.parents("tr"),
        f = o.prevAll("tr.js-file-line").first(),
        u = o.nextAll("tr.js-file-line").first(),
        f.length || u.length ? (d = f.children("td").first(), c = u.children("td").first(), h = f.children("td").eq(1), l = u.children("td").eq(1), j = a(h, "data-line-number"), $ = a(l, "data-line-number"), b = a(d, "data-line-number"), v = a(c, "data-line-number"), m = /@@&nbsp;-\d+,(\d+)&nbsp;\+\d+,(\d+)&nbsp;/, p = o.children("td.diff-line-code").html(), g = m.exec(p), y = {
            offset: Math.max(n, 20),
            anchor: s
        },
        (null != g ? g.length: void 0) >= 3 && (y.left_hunk_size = g[1], y.right_hunk_size = g[2]), t(e.attr("data-remote"), o, b, v, j, $, i, r, y)) : void 0
    },
    n = function(e, n, s) {
        var i, r, o;
        return i = e.parents("tr"),
        r = i.next(),
        o = a(r, "data-position"),
        t(e.attr("data-remote"), i, -1, o, -1, o, n, s)
    },
    $(document).on("click", ".js-expand",
    function() {
        var t;
        return t = $(this).parents("tr"),
        window.location.hash = t.attr("data-anchor")
    }),
    $.hashChange(function() {
        var t;
        return t = window.location.hash,
        s(t, !0)
    }),
    s = function(t, s) {
        var i, r, c, l, u, d, h, f, m, p, g, v, y, b, j, w;
        if (t.length && (d = o(t), null !== d && (y = d[1], j = parseInt(d[2], 10), m = t.slice(1), u = $(document.getElementById(m)), !(u.length || (l = $("a[name='" + y + "']").next(), g = l.find(".js-expand").parent("td"), v = function() {
            var t, e, n;
            for (n = [], t = 0, e = g.length; e > t; t++) p = g[t],
            r = $(p),
            f = a(r, "data-line-number") - j,
            n.push({
                expanderCell: r,
                distance: f,
                absDistance: Math.abs(f)
            });
            return n
        } (), w = v.sort(function(t, e) {
            return t.absDistance > e.absDistance ? 1 : -1
        }), b = function() {
            var t, e, n;
            for (n = [], t = 0, e = w.length; e > t; t++) p = w[t],
            p.distance >= 0 && n.push(p);
            return n
        } (), 0 === b.length && (b = w), b.length < 1))))) return i = b[0].expanderCell,
        h = b[0].absDistance,
        i.length ? (c = i.children(".js-expand"), c.hasClass("js-review-comment") ? n(c, t, s) : e(c, h + 1, y, t, s)) : void 0
    }
}.call(this),
function() {
    $(function() {
        var t, e;
        return t = $(".js-newsletter-frequency-choice"),
        t.length ? (e = function() {
            var e;
            return t.find(".selected").removeClass("selected"),
            e = t.find("input[type=radio]:enabled:checked"),
            e.closest(".choice").addClass("selected")
        },
        t.on("change", "input[type=radio]",
        function() {
            return e()
        }), e()) : void 0
    }),
    $(document).on("ajaxSuccess", ".js-subscription-toggle",
    function() {
        var t;
        return t = $(this).find(".selected .notice"),
        t.addClass("visible"),
        setTimeout(function() {
            return t.removeClass("visible")
        },
        2e3)
    }),
    $(document).on("graph:load", ".js-explore-commit-activity-graph",
    function(t, e) {
        var n, s, i, r, a, o, c, l, u, d, h;
        return $(t.target).empty().append($("h3").addClass("featured-graph-title").text("12 weeks commit activity")),
        e = e.reverse().slice(0, 12).reverse(),
        r = {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        c = 390 - r.left - r.right,
        i = 200 - r.top - r.bottom,
        s = d3.time.format("%m/%d"),
        l = d3.scale.ordinal().rangeRoundBands([0, c], .1).domain(d3.range(e.length)),
        d = d3.scale.linear().range([i, 0]).domain([0, d3.max(e,
        function(t) {
            return t.total
        })]),
        u = d3.svg.axis().scale(l).ticks(6).tickFormat(function(t, n) {
            var i;
            return i = new Date(1e3 * e[n].week),
            s(i)
        }),
        h = d3.svg.axis().scale(d).ticks(3).orient("left").tickFormat(d3.formatSymbol),
        o = d3.tip().attr("class", "svg-tip").offset([ - 10, 0]).html(function(t, n) {
            var s;
            return s = moment(1e3 * e[n].week),
            "<strong>" + t.total + "</strong> " + $.pluralize(t.total, "commit") + " the week of " + s.format("MMMM Do")
        }),
        a = d3.select(t.target).append("svg").attr("width", c + r.left + r.right).attr("height", i + r.top + r.bottom).append("g").attr("transform", "translate(" + r.left + "," + r.top + ")").call(o),
        a.append("g").attr("class", "x axis").attr("transform", "translate(0," + i + ")").call(u).selectAll(".tick").style("display",
        function(t, e) {
            return 0 !== e % 3 ? "none": "block"
        }),
        a.append("g").attr("class", "y axis").call(h),
        n = a.selectAll("g.mini").data(e).enter().append("g").attr("class", "bar mini").attr("transform",
        function(t, e) {
            return "translate(" + l(e) + ", 0)"
        }),
        n.append("rect").attr("width", l.rangeBand()).attr("height",
        function(t) {
            return i - d(t.total)
        }).attr("y",
        function(t) {
            return d(t.total)
        }).on("mouseover", o.show).on("mouseout", o.hide)
    }),
    $(document).on("carousel:unselected", ".js-carousel-slides .js-carousel-slide:not(.no-video)",
    function() {
        var t;
        return t = $(this).find("iframe"),
        t.length ? t[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*") : void 0
    }),
    $(document).on("ajaxSuccess", ".js-explore-newsletter-subscription-container",
    function(t, e) {
        return $(this).replaceWith(e.responseText)
    })
}.call(this),
function() {
    var t, e;
    t = function() {
        var t;
        return t = $("#js-features-branch-diagram"),
        t.removeClass("preload"),
        t.find("path").each(function() {
            var t, e, n;
            return $(this).is("#js-branch-diagram-branch") ? n = "stroke-dashoffset 3.5s linear 0.25s": $(this).is("#js-branch-diagram-master") ? n = "stroke-dashoffset 4.1s linear 0s": $(this).is("#js-branch-diagram-arrow") && (n = "stroke-dashoffset 0.2s linear 4.3s"),
            e = $(this).get(0),
            t = e.getTotalLength(),
            e.style.transition = e.style.WebkitTransition = "none",
            e.style.strokeDasharray = t + " " + t,
            e.style.strokeDashoffset = t,
            e.getBoundingClientRect(),
            e.style.transition = e.style.WebkitTransition = n,
            e.style.strokeDashoffset = "0"
        })
    },
    $(document).on("click", ".js-segmented-nav a",
    function(t) {
        var e, n;
        return n = $(this).data("selected-tab"),
        e = $(this).closest(".js-segmented-nav"),
        e.find("li").removeClass("active"),
        e.siblings(".js-selected-nav-tab").removeClass("active"),
        $(this).parent("li").addClass("active"),
        $("." + n).addClass("active"),
        t.preventDefault()
    }),
    e = function() {
        return $(document).scrollTop() >= $("#js-features-branch-diagram").offset().top - 700 ? t() : void 0
    },
    $.observe("#js-features-branch-diagram.preload", {
        add: function() {
            return $(window).on("scroll", e)
        },
        remove: function() {
            return $(window).off("scroll", e)
        }
    })
}.call(this),
function() {
    $(document).on("click", "#fork-select .target",
    function() {
        var t;
        if (!$(this).hasClass("disabled")) return t = $(this).text().replace("@", ""),
        $("#organization").val(t),
        $("#fork").submit()
    })
}.call(this),
function() {
    var t;
    $.observe(".js-hook-url-field",
    function(t) {
        var e, n, s;
        e = $(t),
        n = function(t) {
            var e, n;
            return e = $(t).closest("form"),
            n = /^https:\/\/.+/.test(t.val()),
            e.toggleClass("is-ssl", n)
        },
        s = function(t) {
            var e, n;
            return n = /^((?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?|)$/i,
            e = n.test(t.val()),
            t.closest("form").toggleClass("is-invalid-url", !e)
        },
        e.on("keyup",
        function() {
            return function() {
                return n(e)
            }
        } (this)),
        e.on("throttled:input",
        function() {
            return function() {
                return s(e)
            }
        } (this)),
        n(e),
        s(e)
    }),
    $(document).on("click", ".js-hook-toggle-ssl-verification",
    function(t) {
        return t.preventDefault(),
        $(".js-ssl-hook-fields").toggleClass("is-not-verifying-ssl"),
        $(".js-ssl-hook-fields").hasClass("is-not-verifying-ssl") ? ($(".js-hook-ssl-verification-field").val("1"), $(document).trigger("close.facebox")) : $(".js-hook-ssl-verification-field").val("0")
    }),
    t = function(t) {
        var e;
        return console.log("chooseEvents", t),
        e = $(".js-hook-event-checkbox"),
        e.prop("checked", !1),
        null != t ? e.filter(t).prop("checked", !0) : void 0
    },
    $(document).on("change", ".js-hook-event-choice",
    function() {
        var t;
        return t = "custom" === $(this).val(),
        $(".js-hook-events-field").toggleClass("is-custom", t),
        !0
    }),
    $(document).on("submit", ".js-hook-form",
    function() {
        var e, n;
        return e = $(this),
        n = e.find(".js-hook-event-choice:checked").val(),
        "custom" === n && $(".js-hook-wildcard-event").prop("checked", !1),
        "push" === n && t('[value="push"]'),
        "all" === n && t(".js-hook-wildcard-event"),
        !0
    }),
    $(document).on("details:toggle", ".js-hook-delivery-item",
    function() {
        var t, e, n;
        return e = $(this),
        e.data("details-load-initiated") ? void 0 : (e.data("details-load-initiated", !0), t = e.find(".js-hook-delivery-details"), t.addClass("is-loading"), n = $.get(t.data("url")), n.done(function(e) {
            return t.replaceContent(e)
        }), n.fail(function() {
            return t.addClass("has-error")
        }), n.always(function() {
            return t.removeClass("is-loading")
        }))
    }),
    $(document).on("click", ".js-hook-delivery-details .js-tabnav-tab",
    function() {
        var t, e, n;
        return e = $(this),
        t = e.closest(".js-hook-delivery-details"),
        t.find(".js-tabnav-tab").removeClass("selected"),
        n = t.find(".js-tabnav-tabcontent").removeClass("selected"),
        e.addClass("selected"),
        n.filter("[data-tab-name=" + e.data("tab-target") + "]").addClass("selected")
    }),
    $(document).on("click", ".js-hook-deliveries-pagination-button",
    function(t) {
        var e, n, s;
        return t.preventDefault(),
        e = $(this),
        n = e.parent().addClass("loading"),
        s = $.get(e.attr("href")),
        s.done(function(t) {
            return n.replaceWith(t)
        })
    }),
    $(document).on("click", ".js-redeliver-hook-delivery-button",
    function(t) {
        var e, n, s, i;
        return t.preventDefault(),
        e = $(this),
        e.hasClass("disabled") ? void 0 : (e.addClass("disabled"), s = e.data("delivery-guid"), n = $('.js-hook-delivery-details[data-delivery-guid="' + s + '"]'), console.log(s, n), i = $.post(e.attr("href")), i.done(function(t) {
            return $(document).trigger("close.facebox"),
            n.replaceWith(t)
        }))
    }),
    $(document).on("deferredcontent:loaded", ".js-hook-delivery-details",
    function() {
        var t, e;
        return t = $(this),
        e = t.closest(".js-hook-delivery-item"),
        e.find(".js-item-status").removeClass("success pending failure").addClass(t.data("status-class")),
        e.find(".js-item-status-tooltip").attr("aria-label", t.data("status-message"))
    })
}.call(this),
function() {
    $(document).on("focusin", "#js-issues-search",
    function() {
        return $(this).next(".js-issues-bar").addClass("issues-bar-focus")
    }),
    $(document).on("focusout", "#js-issues-search",
    function() {
        return $(this).next(".js-issues-bar").removeClass("issues-bar-focus")
    }),
    $(document).on("click", ".js-issues-bar li",
    function() {
        var t;
        return t = $(this).data("query"),
        $("#js-issues-search").val(t).submit(),
        $(this).removeClass("issues-bar-focus")
    })
}.call(this),
function() {
    var t, e;
    e = function(t, e, n) {
        var s, i;
        for (n || (n = []), "string" == typeof n && (n = [n]), n = function() {
            var t, e, s;
            for (s = [], t = 0, e = n.length; e > t; t++) i = n[t],
            i.match(/\s/) ? s.push('"' + i + '"') : s.push(i);
            return s
        } (), s = RegExp("" + e + ':([^\\s"]+|"[^"]+")', "g"), t = t.replace(s,
        function(t, s) {
            var r;
            return r = n.indexOf(s),
            -1 === r ? (i = n.shift()) ? "" + e + ":" + i: "": (n.splice(r, 1), "" + e + ":" + s)
        }); i = n.shift();) t += " " + e + ":" + i;
        return t.trim().replace(/\s+/g, " ")
    },
    t = function(t) {
        var e, n, s, i, r, a;
        for (e = {},
        a = $(t).find("input.js-issue-search-filter"), i = 0, r = a.length; r > i; i++) n = a[i],
        s = n.name.match(/q\[(\w+)\]/)[1],
        null == e[s] && (e[s] = []),
        n.checked && e[s].push(n.value);
        return e
    },
    $(document).on("change", ".js-issue-search-filter",
    function() {
        var n, s, i, r, a;
        n = document.getElementById("js-issues-search"),
        i = n.value,
        a = t($(".toolbar-filters"));
        for (s in a) r = a[s],
        i = e(i, s, r);
        n.value = i
    }),
    $(document).on("menu:deactivate", ".js-issues-toolbar-filters .js-menu-container",
    function() {
        $(this).data("submit-search-filter") && ($(this).removeData("submit-search-filter"), $("#js-issues-search").submit())
    }),
    $(document).on("selectmenu:selected", ".js-issues-toolbar-filters .js-label-select-menu",
    function() {
        return $(this).menu("deactivate")
    }),
    $(document).on("change", ".js-issue-search-filter",
    function() {
        var t;
        return t = $(this).closest(".js-menu-container"),
        t.length ? t.data("submit-search-filter", !0) : $("#js-issues-search").submit()
    })
}.call(this),
function() {
    $(document).on("change", "#js-triage-select-all-issues",
    function() {
        return $(".js-issues-list-check").prop("checked", this.checked),
        $("#js-issues-toolbar").toggleClass("triage-mode", this.checked)
    }),
    $(document).on("change", ".js-issues-list-check",
    function() {
        var t, e;
        return e = $("#js-triage-select-all-issues")[0],
        t = $(".js-issues-list-check:checked").length,
        e.checked = 25 === t,
        e.indeterminate = t > 0 && 25 > t,
        $("#js-issues-toolbar").toggleClass("triage-mode", t > 0)
    }),
    $(document).on("selectmenu:selected", ".js-issues-toolbar-triage .js-navigation-item",
    function() {
        var t, e, n, s, i, r, a;
        for (n = $(this).find("input.js-issue-search-filter")[0], e = $("#triage"), s = n.name.match(/q\[(\w+)\]/)[1], n = $("<input>", {
            type: "hidden",
            name: s,
            value: n.value
        }), e.append(n), a = $(".js-issues-list-check:checked"), i = 0, r = a.length; r > i; i++) t = a[i],
        n = $("<input>", {
            type: "hidden",
            name: "numbers[]",
            value: t.value
        }),
        e.append(n);
        return e.submit()
    })
}.call(this),
function() {
    var t, e, n, r, i, o = [].indexOf ||
    function(t) {
        for (var e = 0,
        n = this.length; n > e; e++) if (e in this && this[e] === t) return e;
        return - 1
    };
    e = null,
    t = function(t) {
        e && n(e),
        $(t).fire("menu:activate",
        function() {
            return $(document).on("keydown.menu", i),
            $(document).on("click.menu", r),
            e = t,
            $(t).performTransition(function() {
                return $(document.body).addClass("menu-active"),
                $(t).addClass("active"),
                $(t).find(".js-menu-content[aria-hidden]").attr("aria-hidden", "false")
            }),
            $(t).fire("menu:activated", {
                async: !0
            })
        })
    },
    n = function(t) {
        $(t).fire("menu:deactivate",
        function() {
            return $(document).off(".menu"),
            e = null,
            $(t).performTransition(function() {
                return $(document.body).removeClass("menu-active"),
                $(t).removeClass("active"),
                $(t).find(".js-menu-content[aria-hidden]").attr("aria-hidden", "true")
            }),
            $(t).fire("menu:deactivated", {
                async: !0
            })
        })
    },
    r = function(t) {
        e && ($(t.target).closest(e)[0] || (t.preventDefault(), n(e)))
    },
    i = function(t) {
        e && "esc" === t.hotkey && (o.call($(document.activeElement).parents(), e) >= 0 && document.activeElement.blur(), t.preventDefault(), n(e))
    },
    $(document).on("click", ".js-menu-container",
    function(r) {
        var i, o, a;
        i = this,
        (a = $(r.target).closest(".js-menu-target")[0]) ? (r.preventDefault(), i === e ? n(i) : t(i)) : (o = $(r.target).closest(".js-menu-content")[0]) || i === e && (r.preventDefault(), n(i))
    }),
    $(document).on("click", ".js-menu-container .js-menu-close",
    function(t) {
        n($(this).closest(".js-menu-container")[0]),
        t.preventDefault()
    }),
    $.fn.menu = function(e) {
        var r, i;
        return r = $(this).closest(".js-menu-container")[0],
        i = {
            activate: function() {
                return function() {
                    return t(r)
                }
            } (this),
            deactivate: function() {
                return function() {
                    return n(r)
                }
            } (this)
        },
        "function" == typeof i[e] ? i[e]() : void 0
    }
}.call(this),
function() {
    var t, e, n;
    e = function(e, n) {
        return e.closest(".js-label-editor").find(".js-color-editor-bg").css("background-color", n),
        e.css("color", t(n, -.5)),
        e.css("border-color", n)
    },
    n = function(t) {
        var e, n;
        return e = "#eee",
        n = $(t).closest(".js-color-editor"),
        n.find(".js-color-editor-bg").css("background-color", e),
        t.css("color", "#c00"),
        t.css("border-color", e)
    },
    t = function(t, e) {
        var n, s, i;
        for (t = String(t).toLowerCase().replace(/[^0-9a-f]/g, ""), t.length < 6 && (t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2]), e = e || 0, i = "#", n = void 0, s = 0; 3 > s;) n = parseInt(t.substr(2 * s, 2), 16),
        n = Math.round(Math.min(Math.max(0, n + n * e), 255)).toString(16),
        i += ("00" + n).substr(n.length),
        s++;
        return i
    },
    $(document).on("focusin", ".js-color-editor-input",
    function() {
        var t, s;
        return s = $(this),
        t = $(this).closest(".js-label-editor"),
        s.on("throttled:input.colorEditor",
        function() {
            var i;
            return "#" !== s.val().charAt(0) && s.val("#" + s.val()),
            t.removeClass("is-valid is-not-valid"),
            i = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(s.val()),
            t.find(".js-label-editor-submit").toggleClass("disabled", !i),
            i ? (t.addClass("is-valid"), e(s, s.val())) : (t.addClass("is-not-valid"), n(s))
        }),
        s.on("blur.colorEditor",
        function() {
            return s.off(".colorEditor")
        })
    }),
    $(document).on("menu:activate", ".js-editable-label",
    function() {
        var t;
        return t = $(this).find(".js-color-editor-input"),
        e(t, t.val()),
        $(this).find(".js-label-editor").addClass("is-valid"),
        $(this).find(".js-label-editor").addClass("open")
    }),
    $(document).on("menu:deactivate", ".js-editable-label",
    function() {
        var t, e, n;
        return n = $(this).find(".js-color-editor-input"),
        e = $(this).find(".js-label-editor"),
        n.attr("style", ""),
        e.removeClass("is-valid is-not-valid"),
        e.find(".js-color-editor-bg").attr("style", ""),
        e.find(".js-label-editor").removeClass("open"),
        n.val(n.attr("data-original-color")),
        t = $(".js-color-cooser-color")
    }),
    $(document).on("click", ".js-color-cooser-color",
    function() {
        var t, n, s;
        return t = $(this).closest(".js-label-editor"),
        n = "#" + $(this).data("hex-color"),
        s = t.find(".js-color-editor-input"),
        t.find(".js-label-editor-submit").removeClass("disabled"),
        t.removeClass("is-valid is-not-valid"),
        s.val(n),
        e(s, n)
    }),
    $(document).on("submit", ".js-label-editor form",
    function() {
        var t, e;
        return t = $(this).find(".js-color-editor-input"),
        e = t.val(),
        e.length < 6 && (e = e[1] + e[1] + e[2] + e[2] + e[3] + e[3]),
        t.val(e.replace("#", ""))
    }),
    $(document).on("focusin", ".js-label-editor",
    function() {
        return $(this).closest(".js-label-editor").addClass("open")
    }),
    $(function() {
        var t;
        return t = $("#issues_list"),
        t.length ? t.selectableList(".js-color-chooser", {
            wrapperSelector: ".js-color-cooser-color",
            mutuallyExclusive: !0
        }) : void 0
    })
}.call(this),
function() {
    $.hashChange(function(t) {
        var e, n, s, i;
        return s = t.newURL,
        (n = s.match(/\/issues#issue\/(\d+)$/)) ? (i = n[0], e = n[1], window.location = s.replace(/\/?#issue\/.+/, "/" + e)) : void 0
    }),
    $.hashChange(function(t) {
        var e, n, s, i, r;
        return i = t.newURL,
        (s = i.match(/\/issues#issue\/(\d+)\/comment\/(\d+)$/)) ? (r = s[0], n = s[1], e = s[2], window.location = i.replace(/\/?#issue\/.+/, "/" + n + "#issuecomment-" + e)) : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".js-issues-sort .js-navigation-item",
    function() {
        return $(this).menu("deactivate")
    }),
    $(function() {
        var t, e;
        return t = $("#issues_list"),
        t.length ? (e = function() {
            return $.pjax.reload(t)
        },
        t.on("navigation:keydown", ".js-issues-list .js-list-browser-item",
        function(t) {
            return "x" === t.hotkey ? $(this).click().trigger("change") : void 0
        }), t.selectableList(".js-selectable-issues", {
            wrapperSelector: ".js-list-browser-item",
            itemParentSelector: "",
            enableShiftSelect: !0,
            ignoreLinks: !0
        }), t.on("click", ".js-milestone-issue-filter .js-navigation-item",
        function() {
            return $(this).menu("deactivate")
        }), t.selectableList(".js-issue-sidebar .js-color-label-list"), t.on("click", ".js-editable-labels-container .js-manage-labels",
        function() {
            var t, n, s, i;
            return t = $(this),
            n = t.closest(".js-editable-labels-container"),
            i = n.find(".js-editable-labels-show"),
            s = n.find(".js-editable-labels-edit"),
            i.hasClass("hidden") ? e() : (i.addClass("hidden"), s.removeClass("hidden"), t.addClass("selected"), $(document).on("keydown.manage-labels",
            function(e) {
                return 27 === e.keyCode ? t.click() : void 0
            })),
            !1
        }), t.on("ajaxSuccess", ".js-color-label-delete",
        function() {
            return $(this).closest(".color-label").addClass("hidden")
        }), t.on("change", ".js-issues-list-select-all",
        function() {
            var e, n;
            return e = this.checked,
            n = e ? ":not(:checked)": ":checked",
            t.find(".select-toggle-check" + n).prop("checked", e).trigger("change"),
            t.find(".js-mass-assign-button").toggleClass("disabled", !e),
            this.indeterminate = !1
        }), t.on("change", ".select-toggle-check",
        function() {
            var e, n;
            return n = t.find(".js-list-browser-item.selected").length,
            e = t.find(".select-toggle-check:not(:checked)").length,
            t.find(".js-mass-assign-button").toggleClass("disabled", !n),
            $(".js-issues-list-select-all").get(0).indeterminate = n && e
        }), t.find(":checked").removeProp("checked"), t.on("click", ".js-issues-list-close",
        function() {
            var n;
            return $.ajax({
                type: "PUT",
                url: $(this).attr("data-url"),
                data: {
                    issues: function() {
                        var e, s, i, r;
                        for (i = t.find(".js-issues-list :checked"), r = [], e = 0, s = i.length; s > e; e++) n = i[e],
                        r.push($(n).val());
                        return r
                    } ()
                },
                success: e
            }),
            !1
        }), t.on("ajaxSuccess", ".js-navigation-item", e), t.pageUpdate()) : void 0
    })
}.call(this),
function() {
    $(document).on("menu:activate", ".js-issue-mass-assign",
    function() {
        var t, e, n;
        t = $(this).find("form"),
        t.find(".js-issue-number").remove(),
        n = function() {
            var t, n, s, i;
            for (s = $(".js-issues-list-checkbox").filter(":checked"), i = [], t = 0, n = s.length; n > t; t++) e = s[t],
            i.push($("<input>", {
                type: "hidden",
                "class": "js-issue-number",
                name: "issues[]",
                value: $(e).val()
            }));
            return i
        } (),
        t.append(n)
    }),
    $(document).on("ajaxSuccess", ".js-issue-mass-assign",
    function() {
        return $.pjax.reload($("#issues_list"))
    })
}.call(this),
function() {
    $(document).on("click", ".js-new-issue-form .js-composer-labels",
    function(t) {
        return t.preventDefault()
    }),
    $.pageUpdate(function() {
        var t, e, n, s;
        for (s = $(this).find(".js-new-issue-form"), e = 0, n = s.length; n > e; e++) t = s[e],
        $(t).data("selectable-list-installed") || ($(t).selectableList(".js-composer-labels"), $(t).data("selectable-list-installed", !0))
    })
}.call(this),
function() {
    var t;
    $(document).on("selectmenu:selected", ".js-composer-assignee-picker .js-navigation-item",
    function() {
        var t, e, n;
        return t = $(this).closest(".js-infobar"),
        e = $(this).find("input[type=radio]"),
        n = $(this).hasClass("js-clear-assignee"),
        t.find(".js-composer-assignee-picker").toggleClass("is-showing-clear-item", !n),
        t.find(".js-assignee-infobar-item-wrapper").html(function() {
            return function() {
                return n ? "No one will be assigned": "<a href='/" + e.val() + "' class='css-truncate-target'>" + e.val() + "</a> will be assigned"
            }
        } (this))
    }),
    $(document).on("selectmenu:selected", ".js-assignee-picker .js-navigation-item",
    function() {
        var e;
        return e = $(this).closest("form"),
        t(e, {},
        function(t) {
            return function() {
                var e, n, s;
                return e = $(t).closest(".js-assignee-picker"),
                s = $(t).hasClass("js-clear-assignee"),
                e.toggleClass("is-showing-clear-item", !s),
                n = e.hasClass("js-assignee-picker-next") ? "": " is assigned",
                $(".js-assignee-infobar-item-wrapper").html(function() {
                    var e, i;
                    return s ? "No one assigned": (i = $(t).find("input[type=radio]"), e = $(t).find(".js-select-menu-item-gravatar"), "" + e.html() + " <a href='/" + i.val() + "' class='assignee css-truncate-target'>" + i.val() + "</a>" + n)
                })
            }
        } (this))
    }),
    $(document).on("selectmenu:selected", ".js-composer-milestone-picker .js-navigation-item",
    function() {
        var t, e, n, s, i;
        return t = $(this).closest(".js-infobar"),
        s = $(this).find("input[type=radio]"),
        e = t.find('input[name="issue[milestone_id]"]'),
        n = t.find('input[name="new_milestone_title"]'),
        $(this).hasClass("js-new-item-form") ? (e.val("new"), n.val($(this).find(".js-new-item-name").html())) : e.val(s[0].value),
        i = $(this).hasClass("js-clear-milestone"),
        t.find(".js-composer-milestone-picker").toggleClass("is-showing-clear-item", !i),
        $(".js-composer-milestone-title").html(function(t) {
            return function() {
                return i ? "No milestone": '<strong class="css-truncate-target">' + $(t).find(".js-milestone-title").html() + "</strong>"
            }
        } (this))
    }),
    $(document).on("selectmenu:selected", ".js-milestone-picker .js-navigation-item",
    function() {
        var e;
        return e = $(this).closest("form"),
        t(e, {},
        function(t) {
            return function(e) {
                var n, s, i;
                return s = $(t).closest(".js-milestone-picker"),
                i = $(t).hasClass("js-clear-milestone"),
                s.toggleClass("is-showing-clear-item", !i),
                n = $(".js-milestone-infobar-item-wrapper"),
                n.length ? (n.html(e.infobar_body), s.menu("deactivate"), s.find(".js-milestone-picker-body").html(e.select_menu_body)) : void 0
            }
        } (this))
    }),
    $(document).on("ajaxSend", ".js-issue-list-label-select-menu",
    function() {
        return $(this).addClass("is-loading")
    }),
    $(document).on("click", ".js-apply-labels",
    function() {
        var e;
        return e = $(this).closest("form"),
        t(e, {
            type: "put"
        },
        function(t) {
            return function() {
                return $(t).menu("deactivate")
            }
        } (this)),
        !1
    }),
    $(document).on("click", ".js-remove-labels",
    function() {
        var e;
        return e = $(this).closest("form"),
        t(e, {
            type: "delete"
        },
        function(t) {
            return function() {
                return $(t).menu("deactivate")
            }
        } (this)),
        !1
    }),
    $(document).on("selectmenu:selected", ".js-issue-show-label-select-menu .js-navigation-item",
    function() {
        var e, n, s;
        return e = $(this).closest("form"),
        n = $(this).find("input[type=checkbox]"),
        s = {
            type: n.is(":checked") ? "put": "delete",
            data: {
                "issues[]": e.find(".js-issue-number").val(),
                "labels[]": n.val()
            }
        },
        t(e, s,
        function() {
            return function(t) {
                return $(".discussion-labels > .color-label-list, .js-timeline-label-list").html(t.labels)
            }
        } (this)),
        !1
    }),
    $(document).onFocusedKeydown(".js-issue-list-label-select-menu .js-filterable-field",
    function() {
        return function(t) {
            return "enter" === t.hotkey ? !1 : void 0
        }
    }),
    t = function(t, e, n) {
        var s;
        if (s = t[0]) return $.ajax({
            context: s,
            type: e.type || t.attr("method"),
            url: t.attr("action"),
            data: e.data || t.serialize(),
            success: n
        })
    }
}.call(this),
function() {
    var t;
    t = function() {
        var t;
        return t = {
            div: "#keyboard_shortcuts_pane",
            ajax: "/site/keyboard_shortcuts?url=" + window.location.pathname
        },
        $.facebox(t, "shortcuts")
    },
    $(document).on("click", ".js-keyboard-shortcuts",
    function() {
        return t(),
        !1
    }),
    $(document).on("click", ".js-see-all-keyboard-shortcuts",
    function() {
        return $(this).remove(),
        $(".facebox .js-hidden-pane").css("display", "table-row-group"),
        !1
    }),
    $(document).on("keypress",
    function(e) {
        return e.target === document.body ? 63 === e.which ? ($(".facebox").is($.visible) ? $.facebox.close() : t(), !1) : void 0 : void 0
    })
}.call(this),
function() {
    $(document).on("ajaxSuccess", ".js-milestones-assign, .js-milestones-unassign",
    function() {
        return window.location.reload()
    }),
    $(document).on("click", ".js-milestone-toggle-state",
    function() {
        var t, e;
        return e = $(this).val(),
        t = $(this).parents(".js-milestone-form"),
        t.find("#milestone_state").val(e)
    })
}.call(this),
function() {
    var t;
    $.pageUpdate(t = function() {
        var t, e, n, s;
        for (s = $(this).find("input.js-date-input"), e = 0, n = s.length; n > e; e++) t = s[e],
        $(t).data("datePicker") || new DateInput(t)
    }),
    $(document).on("click", ".js-date-input-clear",
    function() {
        return $("input.js-date-input").data("datePicker").resetDate(),
        !1
    })
}.call(this),
function() {
    var t;
    t = function(t) {
        return $(t).is(".read") ? void 0 : $(t).toggleClass("unread read")
    },
    $(document).on("click", ".js-notification-target",
    function() {
        return t($(this).closest(".js-notification"))
    }),
    $(document).on("ajaxSuccess", ".js-delete-notification",
    function() {
        return t($(this).closest(".js-notification"))
    }),
    $(document).on("ajaxSuccess", ".js-mute-notification",
    function() {
        var e;
        return t($(this).closest(".js-notification")),
        e = $(this).closest(".js-notification"),
        this.action = e.is(".muted") ? this.action.replace("unmute", "mute") : this.action.replace("mute", "unmute"),
        e.toggleClass("muted")
    }),
    $(document).on("ajaxSuccess", ".js-mark-visible-as-read",
    function() {
        var t;
        return t = $(this).closest(".js-notifications-browser"),
        t.find(".unread").toggleClass("unread read"),
        t.find(".js-mark-as-read-confirmation").show()
    }),
    $(document).on("ajaxSuccess", ".js-mark-remaining-as-read",
    function() {
        var t;
        return t = $(this).closest(".js-notifications-browser"),
        t.find(".js-mark-remaining-as-read").hide(),
        t.find(".js-mark-remaining-as-read-confirmation").show()
    }),
    $(document).on("navigation:keydown", ".js-notification",
    function(t) {
        switch (t.hotkey) {
        case "I":
        case "e":
        case "y":
            return $(this).find(".js-delete-notification").submit(),
            !1;
        case "M":
        case "m":
            return $(this).find(".js-mute-notification").submit(),
            !1
        }
    }),
    $(document).on("navigation:keyopen", ".js-notification",
    function() {
        return t(this)
    }),
    $(document).on("ajaxBeforeSend", ".js-notifications-subscription",
    function() {
        return $(this).find(".js-spinner").show()
    }),
    $(document).on("ajaxComplete", ".js-notifications-subscription",
    function() {
        return $(this).find(".js-spinner").hide()
    })
}.call(this),
function() {
    $(document).on("change", '.js-oauth-section-next input[type="radio"]',
    function() {
        var t, e;
        return e = $(this).val(),
        t = $(this).closest(".js-details-container"),
        t.find(".js-sub-container").toggleClass("open", "limited" === e),
        t.removeClass("none default public full limited limited-email limited-follow read write via-public via-full"),
        t.addClass(e),
        "limited" === e ? ($(".js-oauth-section-next .js-limited-user").prop("checked", !0), t.addClass("limited-email limited-follow")) : void 0
    }),
    $(document).on("change", ".js-oauth-section-next .js-limited-user",
    function() {
        var t, e;
        return e = $('.js-oauth-section-next input[name="granted_scope[user]"]:checked').val(),
        "limited" === e ? (t = $(this).closest(".js-details-container"), t.toggleClass($(this).data("option"), $(this).is(":checked"))) : void 0
    }),
    $(document).on("change", ".js-oauth-section-next .js-delete-repo-scope",
    function() {
        var t;
        return t = $(this).closest(".js-details-container"),
        t.toggleClass("delete", $(this).is(":checked"))
    }),
    $(document).on("change", ".js-oauth-section-next .js-repo-status-scope",
    function() {
        var t;
        return t = $(this).closest(".js-details-container"),
        t.removeClass("full none"),
        t.addClass($(this).is(":checked") ? "full": "none")
    }),
    $(document).on("change", ".js-oauth-section-next .js-notifications-scope",
    function() {
        var t;
        return t = $(this).closest(".js-details-container"),
        t.removeClass("read none"),
        t.addClass($(this).is(":checked") ? "read": "none")
    }),
    $(document).on("change", ".js-oauth-section-next .js-gist-scope",
    function() {
        var t;
        return t = $(this).closest(".js-details-container"),
        t.removeClass("full none"),
        t.addClass($(this).is(":checked") ? "full": "none")
    })
}.call(this),
function() {
    $(document).on("click", ".js-orgs-next-coming-soon",
    function() {
        return alert("Coming Soonâ„¢"),
        !1
    }),
    $(document).on("submit", ".org form[data-results-container]",
    function() {
        return ! 1
    })
}.call(this),
function() {
    $.pageUpdate(function() {
        var t;
        return t = {},
        $(".js-activity-timestamp").each(function() {
            var e, n, s;
            return e = $(this),
            s = Date.parse(e.attr("data-timestamp")),
            s > moment().startOf("day")._d && (n = "Today"),
            s > moment().subtract("days", 1).startOf("day") && (n || (n = "Yesterday")),
            n || (n = "Previously"),
            t[n] ? void 0 : (t[n] = !0, e.text(n))
        })
    })
}.call(this),
function() {
    $(document).on("ajaxSend", ".js-remove-member",
    function() {
        return $(this).closest(".js-removing").css({
            opacity: .5
        }),
        $(this)
    }),
    $(document).on("ajaxSuccess", ".js-remove-member",
    function() {
        return $(this).closest(".js-removing").remove()
    })
}.call(this),
function() {
    $(document).on("change", ".js-org-person-toggle",
    function() {
        var t, e, n, s, i, r, a, o, c;
        if (t = $(this).closest(".js-person-grid"), e = t.find(".js-org-person").has(".js-org-person-toggle:checked"), n = function() {
            var t, n, i;
            for (i = [], t = 0, n = e.length; n > t; t++) s = e[t],
            i.push($(s).attr("data-id"));
            return i
        } (), i = n.length > 0, $(".js-member-selected-actions").toggleClass("hidden", !i), $(".js-member-not-selected-actions").toggleClass("hidden", i), $(".js-selected-person-ids").val(n.join(",")), 0 !== n.length && i) {
            for ($(".js-member-selected-actions .js-conceal-or-publicize").addClass("hidden"), a = [], o = 0, c = e.length; c > o; o++) r = e[o],
            $(r).hasClass("js-public-member") && a.push(r);
            return a.length === n.length ? ($(".js-conceal-memberships button").removeClass("hidden"), void 0) : 0 === a.length ? ($(".js-publicize-memberships button").removeClass("hidden"), void 0) : $(".js-bulk-set-visiblity button").removeClass("hidden")
        }
    }),
    $(document).on("change", ".js-select-all-members",
    function() {
        return $(this).is(":checked") ? $(".js-org-person-toggle").prop("checked", "checked") : $(".js-org-person-toggle").prop("checked", !1),
        $(".js-org-person-toggle").trigger("change")
    })
}.call(this),
function() {
    $(document).on("click", ".js-show-all-team-suggestions",
    function() {
        return $.get(this.href,
        function(t) {
            return function(e) {
                return $(t).closest("ul").html(e)
            }
        } (this)),
        !1
    })
}.call(this),
function() {
    $(document).onFocusedInput("#organization_login",
    function() {
        var t;
        return t = $(this).closest("dd").find(".js-field-hint-name"),
        function() {
            return t.text($(this).val())
        }
    }),
    $(document).on("details:toggle", ".discussion-bubble-inner",
    function(t) {
        return $(t.relatedTarget).hasClass("is-jump-link") ? !1 : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".js-repo-search-filter",
    function() {
        var t, e, n, s, i;
        return e = $(this).data("filter"),
        n = $(this).data("negate"),
        t = $(this).closest(".js-autosearch-form").find(".js-autosearch-field"),
        s = t.val(),
        s.indexOf(n) > -1 && (s = s.replace(n, ""), s = s.replace(/^\s*/, "")),
        -1 === s.indexOf(e) && (i = s && s.match(/\s$/) ? "": " ", t.val(s + ("" + i + e + " ")), t.trigger("throttled:input")),
        $("body").removeClass("menu-active"),
        $(".js-repository-filter").removeClass("is-active"),
        !1
    }),
    $(document).on("click", ".js-filter-trigger",
    function() {
        var t, e, n;
        return t = $("body"),
        e = $(this).parent(".js-repository-filter"),
        n = $(this).siblings(".js-repository-filter-field"),
        e.hasClass("is-active") ? (t.removeClass("menu-active"), e.removeClass("is-active")) : (t.addClass("menu-active"), e.addClass("is-active"), n.focus())
    }),
    $(document).on("focus", ".js-repository-filter-field",
    function() {
        var t, e;
        return t = $("body"),
        e = $(this).parent(".js-repository-filter"),
        t.addClass("menu-active"),
        e.addClass("is-active")
    }),
    $(document).on("click", ".js-repository-filter-field",
    function() {
        var t, e;
        return t = $("body"),
        e = $(this).parent(".js-repository-filter"),
        t.addClass("menu-active"),
        e.addClass("is-active")
    }),
    $(document).on("click", ".modal-backdrop",
    function() {
        var t, e;
        return t = $("body"),
        e = $(".js-repository-filter"),
        e.removeClass("is-active"),
        t.removeClass("menu-active")
    }),
    $(document).on("throttled:input", ".js-repository-filter-field",
    function() {
        var t, e;
        return t = $("body"),
        e = $(this).parent(".js-repository-filter"),
        e.removeClass("is-active"),
        t.removeClass("menu-active")
    }),
    $(document).on("click", ".js-ajax-pagination",
    function(t) {
        var e, n;
        if (n = t.target.href) return e = $($(this).data("pagination-container")),
        console.info("paginating", e),
        e.load(n),
        !1
    }),
    $(document).on("keypress", ".js-repository-fallback-search",
    function(t) {
        var e;
        if (13 === t.which) return e = $(this),
        document.location = "http://" + e.data("host") + "/search?q=user%3A" + e.data("org") + "+" + e.val() + "&type=Repositories"
    })
}.call(this),
function() {
    $(document).on("ajaxBeforeSend", ".js-delete-team",
    function() {
        return $(this).addClass("disabled")
    }),
    $(document).on("ajaxSuccess", ".js-delete-team",
    function() {
        return $(this).closest(".js-team").remove()
    }),
    $(document).on("click", ".js-cancel-note",
    function() {
        var t, e;
        return e = $(this).closest(".js-uploadable-container"),
        e.removeClass("is-default"),
        $(".js-note-form", e).removeClass("active"),
        t = $(".js-note-body", e),
        t.css({
            height: "1em"
        }),
        !1
    }),
    $(document).on("focus", ".js-note-body",
    function() {
        return $(this).closest(".js-uploadable-container").addClass("is-default"),
        $(this).closest(".js-note-form").addClass("active")
    }),
    $(document).on("ajaxBeforeSend", ".js-note-form",
    function() {
        return $(".js-note-body").val().trim() && !$(this).hasClass("is-submitting") ? $(this).addClass("is-submitting") : ($(".js-note-body").focus(), !1)
    }),
    $(document).on("ajaxSuccess", ".js-note-form",
    function(t, e, n, s) {
        return $(this).closest(".js-uploadable-container").removeClass("is-default"),
        $(this).removeClass("active"),
        $(this).removeClass("is-submitting"),
        $(".js-activity-list").prepend(s),
        $(".js-note-body", this).val(""),
        $(".js-note-body", this).css({
            height: "1em"
        })
    }),
    $(document).on("ajaxSuccess", ".js-delete-note",
    function() {
        return $(this).closest(".js-note").remove()
    }),
    $(document).on("click", ".js-toggle-note-comments",
    function() {
        var t;
        return t = $(this).closest(".js-note"),
        $(".js-note-comments", t).toggleClass("active"),
        $(".js-comment-body", t).focus(),
        !1
    }),
    $(document).on("focus", ".js-comment-body",
    function() {
        return $(this).closest(".js-note-comment-form").addClass("active")
    }),
    $(document).on("ajaxBeforeSend", ".js-note-comment-form",
    function() {
        return $(".js-comment-body").val().trim() ? void 0 : ($(".js-comment-body").focus(), !1)
    }),
    $(document).on("ajaxSuccess", ".js-note-comment-form",
    function(t, e, n, s) {
        var i;
        return i = $(this).closest(".js-note"),
        $(".js-comment-list", i).append(s),
        $(".js-comment-body", i).val("")
    }),
    $(document).on("ajaxSuccess", ".js-delete-note-comment",
    function() {
        return $(this).closest(".js-note-comment").remove(),
        !1
    }),
    $(document).on("click", ".js-toggle-note-star",
    function() {
        var t, e;
        return t = $(this),
        t.toggleClass("active"),
        e = t.next(".js-note-starred-users"),
        t.hasClass("active") ? (e.prepend($("<img class='starred-user' src='https://github.com/" + e.data("login") + ".png' />")), $.ajax({
            url: t.data("star-path"),
            method: "POST"
        })) : (e.find("img[src*=" + e.data("login") + "]").remove(), $.ajax({
            url: t.data("unstar-path"),
            method: "POST"
        })),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-delete-team-button",
    function() {
        var t;
        return t = $(this),
        t.attr("disabled", "disabled"),
        $.ajax({
            url: t.attr("data-url"),
            type: "delete"
        }),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-show-own-teams",
    function() {
        var t, e, n, s;
        return t = $(".js-team-search-field"),
        s = t.val(),
        n = $(this).attr("data-me"),
        -1 === s.indexOf("@" + n) && (e = s ? " ": "", t.val("" + s + e + "@" + n), t.focus(), t.trigger("throttled:input")),
        !1
    })
}.call(this),
function() {
    $(document).on("throttled:input", ".js-orgs-next-new-team",
    function() {
        var t, e;
        return t = $(this).closest("form"),
        t.addClass("is-sending"),
        t.find(".octicon").attr("class", "octicon hidden"),
        e = $.get($(this).attr("data-check-url"), {
            name: this.value
        }),
        e.done(function(e) {
            return function(n) {
                var s;
                return t.removeClass("is-sending"),
                n ? t.find(".js-orgs-next-team-name-errors").html(n) : t.find(".js-orgs-next-team-name-errors").html(""),
                s = (t.find(".js-error").length || !e.value.trim()) && $(e.value.trim() !== $(e).attr("data-original").trim()),
                s ? t.find(".js-create-team-button").attr("disabled", "disabled") : t.find(".js-create-team-button").removeAttr("disabled"),
                t.find(".js-error").length ? t.find(".octicon").attr("class", "octicon octicon-alert") : e.value.trim() ? t.find(".octicon").attr("class", "octicon octicon-check") : void 0
            }
        } (this))
    }),
    $(document).on("submit", ".js-orgs-next-new-team-form",
    function() {
        return $(this).find(".js-error").length ? !1 : $(".js-orgs-next-new-team").val().trim() ? void 0 : !1
    })
}.call(this),
function() {
    $(document).on("submit", ".js-team-no-member-result-suggestion",
    function() {
        return GitHub.withSudo(function(t) {
            return function() {
                var e, n;
                return e = $(t),
                n = $.post(e.attr("action"), $(t).serialize()),
                n.done(function() {
                    return $(".js-find-member").val("").trigger("throttled:input")
                })
            }
        } (this)),
        !1
    }),
    $(document).on("submit", ".js-remove-team-members-form",
    function() {
        return GitHub.withSudo(function(t) {
            return function() {
                var e, n;
                return e = $(t),
                n = $.post(e.attr("action"), $(t).serialize()),
                n.done(function() {
                    return e.closest(".js-edit-team-member").remove()
                })
            }
        } (this)),
        !1
    }),
    $(document).on("click", ".js-team-description-toggle",
    function() {
        return $(".js-description-toggler").toggleClass("on")
    }),
    $(document).on("ajaxComplete", ".js-team-description-form",
    function() {
        var t;
        return t = $(".js-team-description-field").val(),
        $(".js-description-toggler").toggleClass("on"),
        t.trim() ? $(".js-team-description .description").text(t) : $(".js-team-description .description").html("<span class='link'>This team has no description</span>")
    }),
    $(document).on("member-adder:added", "#team-repository-list",
    function() {
        return $(".js-team-repositories-blankslate").addClass("hidden")
    })
}.call(this),
function() {
    $(document).on("filterable:change", ".js-team-search-name",
    function() {
        return $(".js-team-list").visible().hasClass("filterable-empty") ? $(".js-details-container").addClass("no-results") : $(".js-details-container").removeClass("no-results")
    }),
    $(document).onFocusedInput(".js-new-team-name",
    function() {
        return function() {
            var t, e, n;
            return t = $(this),
            e = /[^0-9A-Za-z_\.]/g,
            n = $(".js-warning", t.closest(".js-create-team")),
            $(".js-actual-team-name").val(t.val().replace(e, "-")),
            t.val() ? (n.html("Will be created as <code>" + t.val().replace(e, "-") + "</code>"), e.test(t.val()) ? n.is($.visible) ? void 0 : n.fadeIn(200) : n.fadeOut(200)) : void 0
        }
    }),
    $(document).on("click", ".js-toggle-all-teams",
    function() {
        return $(".js-all-teams").toggle(),
        $(".js-your-teams").toggle(),
        $(".js-team-search-name").toggle(),
        !1
    }),
    $(document).on("click", ".js-show-more-members",
    function() {
        return $(this).closest(".js-meta").toggleClass("show-all"),
        !1
    })
}.call(this),
function() {
    $(function() {
        var t;
        return $("#load-readme").click(function() {
            var e, n, s, i, r, a;
            return n = $("#gollum-editor-body"),
            e = $("#editor-body-buffer"),
            i = $("#undo-load-readme"),
            a = e.text(),
            t(n, e),
            s = $(this),
            s.prop("disabled", !0),
            s.text(s.data("readme-name") + " loaded"),
            i.show(),
            r = function() {
                return $(this).val() !== a && i.hide(),
                n.off("change keyup", r)
            },
            n.on("change keyup", r),
            !1
        }),
        $("#undo-load-readme").click(function() {
            var e;
            return t($("#gollum-editor-body"), $("#editor-body-buffer")),
            e = $("#load-readme"),
            e.prop("disabled", !1),
            e.text("Load " + e.data("readme-name")),
            $(this).hide(),
            !1
        }),
        t = function(t, e) {
            var n, s, i;
            return n = $(t),
            s = $(e),
            i = n.val(),
            n.val(s.text()),
            s.text(i)
        }
    })
}.call(this),
function() {
    $.pageUpdate(function() {
        return $(".js-profile-to-repo-search")[0] ? $(document).on("submit", ".js-profile-to-repo-search",
        function() {
            var t, e, n;
            return t = $(".js-profile-to-repo-search").data("login"),
            n = $("#your-repos-filter").val(),
            e = "@" + t + " " + n,
            -1 === n.search("@" + t) ? $("#your-repos-filter").val(e) : void 0
        }) : void 0
    })
}.call(this),
function() {
    $(document).on("ajaxSuccess", ".js-cleanup-pull-request",
    function(t, e, n, s) {
        var i, r, a;
        a = s.updateContent;
        for (r in a) i = a[r],
        $(r).updateContent(i)
    }),
    $(document).on("ajaxError", ".js-cleanup-pull-request",
    function(t, e) {
        return $(this).addClass("error"),
        $(this).closest(".js-deletable-state").removeClass("mergeable-merged").addClass("mergeable-error"),
        e.responseText && $(this).find(".js-cleanup-error-message").html(e.responseText),
        !1
    })
}.call(this),
function() {
    $(document).on("details:toggled", "#js-pull-merging",
    function() {
        var t;
        return t = $(this).find(".js-merge-pull-request"),
        t.toggleClass("js-dirty", t.is($.visible))
    }),
    $(document).on("ajaxSuccess", ".js-merge-pull-request",
    function(t, e, n, s) {
        var i, r, a;
        this.reset(),
        $(this).removeClass("js-dirty"),
        a = s.updateContent;
        for (r in a) i = a[r],
        $(r).updateContent(i)
    }),
    $(document).on("ajaxError", ".js-merge-pull-request",
    function(t, e) {
        return $(this).addClass("error"),
        $(this).closest(".js-mergable-state").removeClass("mergeable-clean").addClass("mergeable-error"),
        e.responseText && $(this).find(".js-merge-error-message").text(e.responseText),
        !1
    })
}.call(this),
function() {
    $(document).on("ajaxSend", ".js-restore-head-ref",
    function() {
        return $(this).addClass("is-restoring")
    }),
    $(document).on("ajaxComplete", ".js-restore-head-ref",
    function() {
        return $(this).removeClass("is-restoring")
    }),
    $(document).on("ajaxSuccess", ".js-restore-head-ref",
    function(t, e, n, s) {
        var i, r, a;
        a = s.updateContent;
        for (r in a) i = a[r],
        $(r).updateContent(i)
    }),
    $.pageUpdate(function() {
        var t, e;
        t = $(".js-cleanup-pull-request"),
        e = $(".js-restore-head-ref"),
        e.hide(),
        t.length || e.last().show()
    })
}.call(this),
function() {
    $(document).on("click", ".js-pull-request-tab",
    function(t) {
        var e, n, s, i, r, a;
        if (1 === t.which && !t.metaKey && !t.ctrlKey && (e = $("#" + $(this).attr("data-container-id")), e.length)) {
            for (a = $(".js-pull-request-tab.selected"), i = 0, r = a.length; r > i; i++) n = a[i],
            $(n).removeClass("selected"),
            $("#" + $(n).attr("data-container-id")).removeClass("is-visible");
            return e.addClass("is-visible"),
            $(this).addClass("selected"),
            "function" == typeof(s = window.history).replaceState && s.replaceState(null, document.title, this.href),
            !1
        }
    }),
    $.hashChange(function(t) {
        return $(t.target).closest(".js-details-container").addClass("open")
    }),
    $(document).on("ajaxSuccess", ".js-inline-comment-form",
    function() {
        return $(this).closest("#discussion_bucket").length ? $("#files_bucket").remove() : $("#discussion_bucket").remove()
    }),
    $(document).on("socket:message", ".js-pull-request-tabs",
    function() {
        $(this).ajax()
    }),
    $(document).on("ajaxSuccess", ".js-pull-request-tabs",
    function(t, e, n, s) {
        var i;
        return i = $($.parseHTML(s)),
        $(this).find("#commits_tab_counter").replaceWith(i.find("#commits_tab_counter")),
        $(this).find("#files_tab_counter").replaceWith(i.find("#files_tab_counter")),
        $(this).pageUpdate()
    }),
    $(document).on("socket:message", ".js-pull-request-stale-files",
    function() {
        return $("#files_bucket").addClass("is-stale").pageUpdate()
    })
}.call(this),
function() {
    $(document).on("change", ".js-pulse-period",
    function(t) {
        var e;
        return e = $(t.target).attr("data-url"),
        $.pjax({
            url: e,
            container: "#js-repo-pjax-container"
        })
    })
}.call(this),
function() {
    $(document).on("navigation:open", ".js-create-branch",
    function() {
        return $(this).submit(),
        !1
    }),
    $(document).on("navigation:open", ".js-create-tag",
    function() {
        var t, e, n, s, i, r;
        return e = $(this),
        s = $(".js-select-button"),
        n = $(".js-spinner"),
        t = $(".js-error"),
        i = $(".js-new-item-value").val(),
        r = $(".js-create-tag").attr("data-url"),
        s.text("Creating tag..."),
        n.show(),
        t.hide(),
        $.ajax({
            url: r,
            type: "POST",
            data: {
                tag_name: i
            },
            success: function() {
                var t, n;
                return s.text(i),
                n = e.closest(".select-menu-list").find(".select-menu-item-template"),
                n.length ? (t = n.clone().removeClass("select-menu-item-template").addClass("selected"), t.insertBefore(n), t.find(".js-select-button-text").text(i)) : void 0
            },
            complete: function() {
                return n.hide()
            },
            error: function() {
                return t.show(),
                s.text("No tag selected")
            }
        }),
        !1
    })
}.call(this),
function() {
    var t, e, n, s, i, r;
    $(document).on("click", ".js-releases-field a.remove",
    function() {
        var t;
        return t = $(this).closest("li"),
        t.addClass("delete"),
        t.find("input.destroy").val("true"),
        !1
    }),
    $(document).on("click", ".js-releases-field a.undo",
    function() {
        var t;
        return t = $(this).closest("li"),
        t.removeClass("delete"),
        t.find("input.destroy").val(""),
        !1
    }),
    $(document).on("click", ".js-timeline-tags-expander",
    function() {
        return $(this).closest(".js-timeline-tags").removeClass("is-collapsed")
    }),
    n = ["is-default", "is-saving", "is-saved", "is-failed"],
    s = function(t, e) {
        return t.removeClass(n.join(" ")),
        t.addClass(e),
        "is-saving" === e ? t.attr("disabled", "disabled") : t.removeAttr("disabled")
    },
    $(document).on("click", ".js-save-draft",
    function(t, n) {
        var i, r, a, o, c, l;
        return $("#release_draft").val("1"),
        i = $(this),
        o = i.closest("form"),
        a = $("#delete_release_confirm form"),
        c = o.data("repo-url"),
        l = o.attr("action"),
        r = o.serialize(),
        s(i, "is-saving"),
        $.ajax({
            url: l,
            type: "POST",
            data: r,
            dataType: "json",
            success: function(t) {
                var r, l;
                return l = e("tag", c, t.tag_name),
                o.attr("action", l),
                a.attr("action", l),
                window.history.replaceState(null, document.title, e("edit", c, t.tag_name)),
                r = $("#release_id"),
                r.val() || (r.val(t.id), o.append('<input type="hidden" id="release_method" name="_method" value="put" />')),
                s(i, "is-saved"),
                setTimeout(function() {
                    return s(i, "is-default")
                },
                5e3),
                n ? n() : void 0
            },
            complete: function() {},
            error: function() {
                return s(i, "is-failed")
            }
        }),
        t.preventDefault()
    }),
    $(document).on("click", ".js-publish-release",
    function() {
        return $("#release_draft").val("0")
    }),
    r = ["is-loading", "is-empty", "is-valid", "is-invalid", "is-duplicate", "is-pending"],
    i = function(t) {
        var e;
        switch (t) {
        case "is-valid":
            $(".release-target-wrapper").addClass("hidden");
            break;
        case "is-loading":
            break;
        default:
            $(".release-target-wrapper").removeClass("hidden")
        }
        return e = $(".js-release-tag"),
        e.removeClass(r.join(" ")),
        e.addClass(t)
    },
    t = function(t) {
        return t.val() && t.val() !== t.attr("data-last-checked") ? (i("is-loading"), $.ajax({
            url: t.attr("data-url"),
            type: "GET",
            data: {
                tag_name: t.val()
            },
            dataType: "json",
            success: function(e) {
                return "duplicate" === e.status && parseInt(t.attr("data-existing-id")) === parseInt(e.release_id) ? (i("is-valid"), void 0) : ($(".js-release-tag .js-edit-release-link").attr("href", e.url), i("is-" + e.status))
            },
            error: function() {
                return i("is-invalid")
            },
            complete: function() {
                return t.attr("data-last-checked", t.val())
            }
        })) : void 0
    },
    e = function(t, e, n) {
        return "" + e + "/releases/" + t + "/" + n
    },
    $(document).on("blur", ".js-release-tag-field",
    function() {
        return t($(this))
    }),
    $.observe(".js-release-tag-field",
    function() {
        t($(this))
    }),
    $(document).on("change", ".js-release-tag",
    function() {
        var t, e, n, s, i, r, a, o, c;
        if (n = $(this), t = n.closest("form"), e = t.find(".js-previewable-comment-form"), e.length) {
            for (s = e.data("base-preview-url"), s || (s = e.attr("data-preview-url"), s += s.indexOf("?") >= 0 ? "&": "?", e.data("base-preview-url", s)), i = [], c = n.find('input[name="release[tag_name]"], input[name="release[target_commitish]"]:checked'), a = 0, o = c.length; o > a; a++) r = c[a],
            r.value && i.push({
                name: r.name,
                value: r.value
            });
            return e.attr("data-preview-url", s + $.param(i))
        }
    }),
    $.observe(".js-previewable-comment-form",
    function() {
        $(this).closest("form").find(".js-release-tag").trigger("change")
    })
}.call(this),
function() {
    var t, e = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t() {
            this.validate = e(this.validate, this),
            this.updateUpsell = e(this.updateUpsell, this),
            this.selectedPrivacyToggleElement = e(this.selectedPrivacyToggleElement, this),
            this.handlePrivacyChange = e(this.handlePrivacyChange, this),
            this.handleOwnerChange = e(this.handleOwnerChange, this),
            this.elements = {
                ownerContainer: $(".js-owner-container"),
                iconPreviewPublic: $(".js-icon-preview-public"),
                iconPreviewPrivate: $(".js-icon-preview-private"),
                upgradeUpsell: $("#js-upgrade-container").hide(),
                upgradeConfirmationCheckbox: $(".js-confirm-upgrade"),
                upsells: $(".js-upgrade"),
                privacyToggles: $(".js-privacy-toggle"),
                privateRadio: $(".js-privacy-toggle[value=false]"),
                publicRadio: $(".js-privacy-toggle[value=true]"),
                repoNameField: $("input[type=text].js-repo-name"),
                form: $("#new_repository"),
                licenseContainer: $(".js-license-container"),
                ignoreContainer: $(".js-ignore-container"),
                autoInitCheckbox: $(".js-auto-init-checkbox"),
                teamBoxes: $(".js-team-select"),
                suggestion: $(".js-reponame-suggestion")
            },
            this.current_login = $("input[name=owner]:checked").prop("value"),
            this.privateRepo = !1,
            this.autocheckURL = this.elements.repoNameField.attr("data-autocheck-url"),
            this.changedPrivacyManually = !1,
            this.elements.teamBoxes.hide(),
            this.elements.ignoreContainer.on("change", "input[type=radio]",
            function() {
                return $(".js-auto-init-checkbox").prop("checked", !0)
            }),
            this.elements.licenseContainer.on("change", "input[type=radio]",
            function() {
                return $(".js-auto-init-checkbox").prop("checked", !0)
            }),
            this.elements.ownerContainer.on("change", "input[type=radio]", this.handleOwnerChange),
            this.elements.privacyToggles.on("change",
            function(t) {
                return function(e) {
                    return t.handlePrivacyChange(e.targetElement, e)
                }
            } (this)),
            this.elements.repoNameField.on("change input",
            function(t) {
                return function(e) {
                    return $(e.target).removeClass("is-autocheck-successful"),
                    t.validate()
                }
            } (this)),
            this.elements.upgradeUpsell.on("change input", "input", this.validate),
            this.elements.form.on("repoform:validate", this.validate),
            this.elements.suggestion.on("click",
            function(t) {
                return function(e) {
                    var n;
                    return n = t.elements.repoNameField,
                    n.val($(e.target).text()),
                    n.trigger("change")
                }
            } (this)),
            this.handleOwnerChange(),
            this.updateUpsell(),
            this.validate()
        }
        return t.prototype.handleOwnerChange = function() {
            var t, e, n;
            return this.current_login = $("input[name=owner]:checked").prop("value"),
            e = "" + this.autocheckURL + "?owner=" + encodeURIComponent(this.current_login),
            this.elements.repoNameField.attr("data-autocheck-url", e),
            this.elements.repoNameField.trigger("change"),
            n = this.elements.ownerContainer.find(".select-menu-item.selected"),
            this.elements.teamBoxes.hide().find("input, select").prop("disabled", !0),
            t = this.elements.teamBoxes.filter("[data-login=" + this.current_login + "]"),
            t.show().find("input, select").prop("disabled", !1),
            this.changedPrivacyManually || ("private" === n.attr("data-default") ? this.elements.privateRadio.prop("checked", "checked").change() : this.elements.publicRadio.prop("checked", "checked").change()),
            this.handlePrivacyChange(),
            "yes" === n.attr("data-permission") ? ($(".with-permission-fields").show(), $(".without-permission-fields").hide(), $(".errored").show(), $("dl.warn").show()) : ($(".with-permission-fields").hide(), $(".without-permission-fields").show(), $(".errored").hide(), $("dl.warn").hide()),
            this.updateUpsell()
        },
        t.prototype.handlePrivacyChange = function(t, e) {
            return null == t && (t = this.selectedPrivacyToggleElement()),
            null == e && (e = null),
            e && !e.isTrigger && (this.changedPrivacyManually = !0),
            "false" === t.val() ? (this.privateRepo = !0, this.elements.upgradeUpsell.show(), this.elements.upgradeUpsell.find("input[type=checkbox]").prop("checked", "checked"), this.elements.iconPreviewPublic.hide(), this.elements.iconPreviewPrivate.show()) : (this.privateRepo = !1, this.elements.upgradeUpsell.hide(), this.elements.upgradeUpsell.find("input[type=checkbox]").prop("checked", null), this.elements.form.attr("action", this.elements.form.attr("data-url")), this.elements.iconPreviewPrivate.hide(), this.elements.iconPreviewPublic.show()),
            this.validate()
        },
        t.prototype.selectedPrivacyToggleElement = function() {
            return this.elements.privateRadio.is(":checked") ? this.elements.privateRadio: this.elements.publicRadio
        },
        t.prototype.updateUpsell = function() {
            var t;
            return t = this.elements.upsells.filter("[data-login=" + this.current_login + "]"),
            this.elements.upgradeUpsell.html(t)
        },
        t.prototype.validate = function() {
            var t, e, n;
            return t = this.elements.form,
            n = !0,
            this.elements.repoNameField.is(".is-autocheck-successful") || (n = !1),
            t.find("dl.form.errored").length && (n = !1),
            t.find(".is-autocheck-loading").length && (n = !1),
            e = this.elements.upgradeUpsell.find("input[type=checkbox]"),
            this.privateRepo && e.length && !e.is(":checked") && (n = !1),
            $("button.primary").prop("disabled", !n)
        },
        t
    } (),
    $(function() {
        return $(".page-new-repo").length ? new t: void 0
    }),
    $(document).on("autocheck:send", "#repository_name",
    function() {
        $(this).trigger("repoform:validate")
    }),
    $(document).on("autocheck:complete", "#repository_name",
    function() {
        return $(this).trigger("repoform:validate")
    }),
    $(document).on("autocheck:success", "#repository_name",
    function(t, e) {
        var n, s, i;
        return s = $(this).val(),
        s && s !== e.name ? (n = $(this).closest("dl.form"), n.addClass("warn"), i = $("<dd>").addClass("warning").text("Will be created as " + e.name), n.append(i)) : void 0
    }),
    $(document).on("menu:activated", ".js-ignore-container",
    function() {
        var t, e;
        return t = $(this).find(".js-menu-content"),
        e = t.overflowOffset(),
        e.bottom <= -10 ? t.css({
            marginTop: e.bottom - 20
        }) : void 0
    })
}.call(this),
function() {
    var t;
    $(document).on("pjax:end",
    function() {
        var t, e, n, s, i, r, a, o, c, l;
        if (s = $(document.head).find("meta[name='selected-link']").attr("value"), null != s) for (e = $(".js-repository-container-pjax .js-selected-navigation-item").removeClass("selected"), i = 0, a = e.length; a > i; i++) for (t = e[i], l = null != (c = $(t).attr("data-selected-links")) ? c.split(" ") : void 0, r = 0, o = l.length; o > r; r++) n = l[r],
        n === s && $(t).addClass("selected")
    }),
    $(document).on("click", ".js-repo-home-link, .js-repository-container-pjax a",
    function(t) {
        var e, n;
        if (!$(this).hasClass("js-disable-pjax")) return n = !1,
        e = $("#js-repo-pjax-container"),
        $.pjax.click(t, {
            container: e,
            scrollTo: n
        })
    }),
    t = function() {
        var t;
        return t = null != document.getElementById("js-show-full-navigation"),
        $(".repository-with-sidebar").toggleClass("with-full-navigation", t)
    },
    $(function() {
        var e;
        return (e = document.getElementById("js-repo-pjax-container")) ? t(e) : void 0
    }),
    $(document).on("pjax:end", "#js-repo-pjax-container",
    function() {
        return t(this)
    }),
    $(document).on("tipsy:show", ".js-repo-nav",
    function(t) {
        return $(t.target).hasClass("with-tooltip") ? void 0 : !$(this).closest(".repository-with-sidebar").hasClass("with-full-navigation")
    }),
    $(document).on("pjax:clicked", ".js-directory-link",
    function() {
        return $(this).closest("tr").addClass("is-loading"),
        $(document.body).addClass("disables-context-loader")
    }),
    $(document).on("pjax:click", ".js-octicon-loaders a",
    function() {
        return $(this).addClass("is-loading"),
        $(document).one("pjax:end",
        function(t) {
            return function() {
                return $(t).removeClass("is-loading")
            }
        } (this))
    }),
    $(function() {
        var t;
        return t = $(".mini-nav, .repo-container .menu"),
        t.length ? $.each(t,
        function(t, e) {
            return new FastClick(e)
        }) : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".repository-tree",
    function(t) {
        var e, n;
        return n = $(t.target).closest(".repository-tree").is(this),
        e = $(t.target).is("a"),
        n && !e ? $(this).toggleClass("expanded") : void 0
    }),
    $.pageUpdate(function() {
        return $(".repository-files .selected").each(function() {
            return $(this).parents(".repository-tree").addClass("expanded")
        })
    })
}.call(this),
function() {
    $(document).onFocusedInput(".js-repository-name",
    function() {
        var t, e, n;
        return e = /[^0-9A-Za-z_\.]/g,
        n = $(".js-form-note"),
        t = $(".js-rename-repository-button"),
        function() {
            n.html("Will be renamed as <code>" + this.value.replace(e, "-") + "</code>"),
            e.test(this.value) ? n.is($.hidden) && n.fadeIn() : this.value || n.fadeOut(),
            this.value && this.value !== $(this).attr("data-original-name") ? t.prop("disabled", !1) : t.prop("disabled", !0)
        }
    })
}.call(this),
function() {
    $(document).on("click", ".js-hook-target",
    function(t) {
        return $(".js-hook-target").parents("li").removeClass("selected"),
        $(this).parents("li").addClass("selected"),
        $(".js-hook-group").hide(),
        $(this.hash).show().scrollTo(),
        t.preventDefault()
    }),
    $(document).on("click", ".js-test-hook",
    function(t) {
        var e, n, s;
        return e = $(this),
        s = e.prev(".js-test-hook-message"),
        s.text("Sending payload..."),
        n = e.attr("data-test-service-url"),
        $.ajax({
            type: "POST",
            url: n,
            data: {
                name: e.attr("rel") || ""
            },
            success: function() {
                return s.text("Test payload deployed!")
            },
            error: function() {
                return s.text("Error sending test payload.")
            }
        }),
        t.preventDefault()
    }),
    $(document).on("click", ".js-add-postreceive-url",
    function(t) {
        var e;
        return e = $(this).prev("dl.form").clone(),
        e.find("input").val(""),
        $(this).before(e),
        t.preventDefault()
    }),
    $(document).on("click", ".js-remove-postreceive-url",
    function(t) {
        return $(this).closest(".fields").find("dl.form").length < 2 ? (alert("You cannot remove the last post-receive URL"), !1) : ($(this).closest("dl.form").remove(), t.preventDefault())
    })
}.call(this),
function() {}.call(this),
function() {
    $(document).on("ajaxSend", ".js-action-ldap-create",
    function() {
        return $(this).find(".minibutton").addClass("disabled")
    }),
    $(document).on("ajaxComplete", ".js-action-ldap-create",
    function(t, e) {
        var n, s;
        return n = $(this),
        s = 500 === e.status ? "Oops, something went wrong.": e.responseText,
        n.find(".js-message").show().html(" &ndash; " + s),
        !1
    })
}.call(this),
function() {
    $(document).on("ajaxSend", ".js-action-pull",
    function() {
        return $(this).find(".minibutton").not(".disabled").addClass("reenable disabled")
    }),
    $(document).on("ajaxComplete", ".js-action-pull",
    function(t, e) {
        var n, s, i;
        return n = $(this),
        i = $(t.target),
        200 === e.status && (i.hasClass("close") || i.hasClass("open") ? $.pjax.reload($("#js-pjax-container")) : n.find(".reenable").removeClass("reenable disabled")),
        s = 500 === e.status ? "Oops, something went wrong.": e.responseText,
        n.find(".js-message").show().html(s),
        !1
    })
}.call(this),
function() {
    $.support.pjax && $(document).on("submit", ".js-stars-search",
    function(t) {
        var e;
        return (e = $(this).closest("[data-pjax-container]")[0]) ? $.pjax.submit(t, {
            container: e
        }) : void 0
    })
}.call(this),
function() {
    $(document).on("click", ".js-styleguide-octicon-facebox",
    function(t) {
        var e, n, s;
        return t.preventDefault(),
        s = $(this).data("octicon-glyph"),
        n = $(this).data("octicon-name"),
        e = $(".js-octicon-facebox-template").html(),
        e = e.replace(/classnamegoeshere/g, n),
        e = e.replace(/glyphgoeshere/g, s),
        jQuery.facebox(e),
        $(document).pageUpdate()
    }),
    $(function() {
        return $(".js-octicons-search-field")[0] ? $(".js-octicons-search-field").focus() : void 0
    })
}.call(this),
function() {
    $(document).on("ajaxBeforeSend", ".js-auto-subscribe-toggle",
    function() {
        return $(this).find("label").append('<img src="' + GitHub.Ajax.spinner + '" width="16" />')
    }),
    $(document).on("ajaxError", ".js-auto-subscribe-toggle",
    function() {
        return $(this).find("label img").remove(),
        $(this).find("label").append('<img src="/images/modules/ajax/error.png">')
    }),
    $(document).on("ajaxSuccess", ".js-auto-subscribe-toggle",
    function() {
        return $(this).find("label img").remove()
    }),
    $(document).on("ajaxBeforeSend", ".js-unignore-form, .js-ignore-form",
    function() {
        return $(this).closest(".subscription-row").addClass("loading")
    }),
    $(document).on("ajaxError", ".js-unignore-form, .js-ignore-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading"),
        $(this).find(".minibutton").addClass("danger").attr("title", "There was a problem unignoring this repo.")
    }),
    $(document).on("ajaxSuccess", ".js-unignore-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading").addClass("unsubscribed")
    }),
    $(document).on("ajaxSuccess", ".js-ignore-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading unsubscribed")
    }),
    $(document).on("ajaxBeforeSend", ".js-unsubscribe-form, .js-subscribe-form",
    function() {
        return $(this).closest(".subscription-row").addClass("loading")
    }),
    $(document).on("ajaxError", ".js-unsubscribe-form, .js-subscribe-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading"),
        $(this).find(".minibutton").addClass("danger").attr("title", "There was a problem with unsubscribing :(")
    }),
    $(document).on("ajaxSuccess", ".js-unsubscribe-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading").addClass("unsubscribed")
    }),
    $(document).on("ajaxSuccess", ".js-subscribe-form",
    function() {
        return $(this).closest(".subscription-row").removeClass("loading unsubscribed")
    }),
    $(document).on("ajaxSuccess", ".js-thread-subscription-status",
    function(t, e, n, s) {
        return $(".js-thread-subscription-status").updateContent(s)
    })
}.call(this),
function() {
    var t;
    t = function() {
        return $(".js-team-add-user-form[data-ajax-save-enabled]").length > 0
    },
    $(document).on("autocomplete:search", ".js-team-add-user-name",
    function() {
        var t, e;
        return e = $(this).val(),
        t = $(".js-team-add-user-autocomplete-results"),
        "" === e ? (t.find("ul").empty(), t.trigger("autocomplete:change"), void 0) : $(this).ajax({
            data: {
                q: e
            },
            success: function(e) {
                return t.find("ul").html(e),
                t.trigger("autocomplete:change")
            }
        })
    }),
    $(document).on("autocomplete:autocompleted:changed", ".js-team-add-user-name",
    function() {
        var t;
        return t = $(".js-team-add-user-button")[0],
        t.disabled = !$(this).attr("data-autocompleted")
    }),
    $(document).on("click", ".js-team-remove-user",
    function(e) {
        var n, s, i;
        return e.preventDefault(),
        $(".js-team-add-user-name").focus(),
        n = $(this).closest("li").remove(),
        s = n.attr("data-login"),
        t() ? (i = $(".js-team-add-user-form").attr("data-destroy-url"), $.ajax({
            url: i,
            data: {
                member: s
            },
            type: "POST"
        })) : void 0
    }),
    $(document).on("click", ".js-team-add-user-button",
    function(e) {
        var n, s, i, r, a, o;
        if (e.preventDefault(), n = $(".js-team-add-user-name"), i = n.val(), i && n.attr("data-autocompleted")) {
            for (n.val(""), o = $(".js-team-user-logins li"), r = 0, a = o.length; a > r; r++) if (s = o[r], $(s).attr("data-login") === i) return;
            return GitHub.withSudo(function() {
                var e;
                return t() && (e = $(".js-team-add-user-form").attr("data-create-url"), $.ajax({
                    url: e,
                    data: {
                        member: i
                    },
                    type: "POST"
                })),
                s = $(".js-team-user-logins li").first().clone(),
                n = s.find("input[type=hidden]"),
                s.removeClass("hidden"),
                s.attr("data-login", i),
                s.find("img").attr("src", "/" + i + ".png"),
                s.find("a").first().attr("href", "/" + i).text(i),
                n.length > 0 && n.val(i).attr("disabled", !1),
                $(".js-team-user-logins").append(s),
                $(".js-team-add-user-name").focus()
            })
        }
    })
}.call(this),
function() {
    var t, e, n = function(t, e) {
        return function() {
            return t.apply(e, arguments)
        }
    };
    t = function() {
        function t(t) {
            var e;
            e = $(t),
            this.name = e.data("theme-name"),
            this.slug = e.data("theme-slug"),
            this.baseHref = e.attr("href")
        }
        return t.prototype.wrappedKey = function(t, e) {
            return null == e && (e = null),
            e ? "" + e + "[" + t + "]": t
        },
        t.prototype.params = function(t) {
            var e;
            return null == t && (t = null),
            e = {},
            e[this.wrappedKey("theme_slug", t)] = this.slug,
            e
        },
        t.prototype.previewSrc = function() {
            return [this.baseHref, $.param(this.params())].join("&")
        },
        t
    } (),
    e = function() {
        function e() {
            this.updateScrollLinks = n(this.updateScrollLinks, this),
            this.scrollThemeLinksContainer = n(this.scrollThemeLinksContainer, this),
            this.onPublishClick = n(this.onPublishClick, this),
            this.onEditClick = n(this.onEditClick, this),
            this.onHideClick = n(this.onHideClick, this),
            this.onThemeLinkClick = n(this.onThemeLinkClick, this),
            this.onThemeNavNextClick = n(this.onThemeNavNextClick, this),
            this.onThemeNavPrevClick = n(this.onThemeNavPrevClick, this),
            this.onScrollForwardsClick = n(this.onScrollForwardsClick, this),
            this.onScrollBackwardsClick = n(this.onScrollBackwardsClick, this),
            this.onPagePreviewLoad = n(this.onPagePreviewLoad, this),
            this.pagePreview = $("#page-preview"),
            this.contextLoader = $("#loader"),
            this.fullPicker = $("#theme-picker-full"),
            this.miniPicker = $("#theme-picker-mini"),
            this.scrollBackwardsLinks = $(".theme-picker-scroll-backwards"),
            this.scrollForwardsLinks = $(".theme-picker-scroll-forwards"),
            this.prevLinks = $(".theme-picker-prev"),
            this.nextLinks = $(".theme-picker-next"),
            this.themeLinksContainer = this.fullPicker.find(".themes"),
            this.themeLinks = this.themeLinksContainer.find("a"),
            this.themes = [],
            this.themeLinks.each(function(e) {
                return function(n, s) {
                    return e.themes.push(new t(s))
                }
            } (this)),
            this.selectedTheme = this.themes[0],
            this.pagePreview.load(this.onPagePreviewLoad),
            this.scrollBackwardsLinks.click(this.onScrollBackwardsClick),
            this.scrollForwardsLinks.click(this.onScrollForwardsClick),
            this.prevLinks.click(this.onThemeNavPrevClick),
            this.nextLinks.click(this.onThemeNavNextClick),
            this.themeLinks.click(this.onThemeLinkClick),
            $("#page-hide").click(this.onHideClick),
            $("#page-edit").click(this.onEditClick),
            $("#page-publish").click(this.onPublishClick),
            this.miniPicker.hide(),
            this.theme(this.selectedTheme),
            this.updateScrollLinks()
        }
        return e.prototype.onPagePreviewLoad = function() {
            var t, e;
            return this.contextLoader.removeClass("visible"),
            t = this.pagePreview[0].contentDocument ? this.pagePreview[0].contentDocument: this.pagePreview[0].contentWindow.document,
            e = "" + this.getDocHeight(t) + "px",
            this.pagePreview.css("visibility", "hidden"),
            this.pagePreview.height("10px"),
            this.pagePreview.height(e),
            this.pagePreview.css("visibility", "visible")
        },
        e.prototype.onScrollBackwardsClick = function() {
            return this.scrollThemeLinksContainer( - 1)
        },
        e.prototype.onScrollForwardsClick = function() {
            return this.scrollThemeLinksContainer(1)
        },
        e.prototype.onThemeNavPrevClick = function() {
            return this.theme(this.prevTheme())
        },
        e.prototype.onThemeNavNextClick = function() {
            return this.theme(this.nextTheme())
        },
        e.prototype.onThemeLinkClick = function(t) {
            return this.theme(this.themeForLink(t.currentTarget)),
            !1
        },
        e.prototype.onHideClick = function(t) {
            var e;
            return $("#header").toggle(),
            this.fullPicker.toggle(),
            this.miniPicker.toggle(),
            this.scrollToTheme(this.theme(), !1),
            e = $(t.currentTarget),
            this.fullPicker.is($.visible) ? (e.addClass("hide"), e.removeClass("show")) : (e.addClass("show"), e.removeClass("hide")),
            !1
        },
        e.prototype.onEditClick = function() {
            return $("#page-edit-form").submit(),
            !1
        },
        e.prototype.onPublishClick = function() {
            var t;
            return t = $("#page-publish-form"),
            t.find('input[name="page[theme_slug]"]').val(this.theme().slug),
            $("#page-publish-form").submit(),
            !1
        },
        e.prototype.scrollThemeLinksContainer = function(t) {
            var e, n, s;
            return n = this.themeLinksContainer.scrollLeft(),
            s = this.themeLinksContainer.outerWidth(!0),
            e = n + s * t,
            this.themeLinksContainer.animate({
                scrollLeft: e
            },
            400,
            function(t) {
                return function() {
                    return t.updateScrollLinks()
                }
            } (this)),
            !1
        },
        e.prototype.updateScrollLinks = function() {
            var t, e, n;
            return t = this.themeLinksContainer.scrollLeft(),
            0 >= t ? (this.scrollBackwardsLinks.addClass("hide"), this.scrollForwardsLinks.removeClass("hide")) : (this.scrollBackwardsLinks.removeClass("hide"), n = this.themeLinksContainer[0].scrollWidth, e = n - this.themeLinksContainer.outerWidth(!0), t >= e ? this.scrollForwardsLinks.addClass("hide") : this.scrollForwardsLinks.removeClass("hide"))
        },
        e.prototype.selectedThemeIndex = function() {
            return this.themes.indexOf(this.selectedTheme)
        },
        e.prototype.prevTheme = function() {
            var t;
            return t = (this.selectedThemeIndex() - 1) % this.themes.length,
            0 > t && (t += this.themes.length),
            this.themes[t]
        },
        e.prototype.nextTheme = function() {
            return this.themes[(this.selectedThemeIndex() + 1) % this.themes.length]
        },
        e.prototype.themeForLink = function(t) {
            return this.themes[this.themeLinks.index($(t))]
        },
        e.prototype.linkForTheme = function(t) {
            return $(this.themeLinks[this.themes.indexOf(t)])
        },
        e.prototype.scrollToTheme = function(t, e) {
            var n, s, i, r, a, o;
            return null == e && (e = !0),
            n = this.linkForTheme(t),
            o = this.themes.indexOf(t),
            r = n.parent().outerWidth(!0),
            i = o * r,
            s = this.themeLinksContainer.scrollLeft(),
            a = s + this.themeLinksContainer.outerWidth(!0),
            s > i || i + r > a ? e ? this.themeLinksContainer.animate({
                scrollLeft: i
            },
            500) : this.themeLinksContainer.scrollLeft(i) : void 0
        },
        e.prototype.theme = function(t) {
            return null == t && (t = null),
            t ? (this.selectedTheme = t, this.showPreviewFor(t), this.themeLinks.removeClass("selected"), this.linkForTheme(t).addClass("selected"), this.scrollToTheme(t), this.miniPicker.find("span.theme-name > strong").text(t.name), !1) : this.selectedTheme
        },
        e.prototype.showPreviewFor = function(t) {
            var e;
            return this.contextLoader.addClass("visible"),
            e = this.fullPicker.find("form"),
            e.find('input[name="theme_slug"]').val(t.slug),
            e.submit()
        },
        e.prototype.getDocHeight = function(t) {
            var e, n;
            return this.pagePreview.height("auto"),
            e = t.body,
            n = t.documentElement,
            Math.max(e.scrollHeight, e.offsetHeight, n.clientHeight, n.scrollHeight, n.offsetHeight)
        },
        e
    } (),
    $(function() {
        return document.getElementById("theme-picker-wrap") ? new e: void 0
    })
}.call(this),
function() {
    var t, e, n, s, i;
    n = function(t) {
        return setTimeout(function() {
            var e, n, i, r, a;
            for (r = $(".js-tree-finder-field"), a = [], n = 0, i = r.length; i > n; n++) e = r[n],
            e.value = t,
            a.push(s(e));
            return a
        },
        0)
    },
    i = null,
    s = function(t, e) {
        var n, r, a, o, c, l, u, d, h, f, m, p;
        if (d = document.getElementById($(t).attr("data-results"))) {
            if (! (a = $(d).data("tree-finder-list"))) return null == i && (i = $.ajax({
                url: $(d).attr("data-url"),
                cache: !0,
                success: function(e) {
                    return $(d).data("tree-finder-list", e.paths),
                    s(t)
                },
                complete: function() {
                    return i = null
                }
            })),
            void 0;
            for (h = $(d).find(".js-tree-browser-result-template").html(), l = $(d).find(".js-tree-finder-results"), null == e && (e = $(t).val()), e ? (o = $.fuzzyRegexp(e), u = $.fuzzySort(a, e)) : u = a, u = u.slice(0, 50), n = function() {
                var t, e, n;
                for (n = [], t = 0, e = u.length; e > t; t++) r = u[t],
                n.push(h.replace(/\$presentationPath/g, r).replace(/\$path/g, encodeURI(r) + window.location.search));
                return n
            } (), l.html(n), p = l.find(".tree-browser-result a"), f = 0, m = p.length; m > f; f++) c = p[f],
            $.fuzzyHighlight(c, e, o);
            l.navigation("focus")
        }
    },
    $(document).onFocusedKeydown(".js-tree-finder-field",
    function(t) {
        return s(this),
        $(this).on("throttled:input." + t,
        function() {
            return s(this)
        }),
        function(t) {
            return "esc" === t.hotkey ? (history.back(), t.preventDefault()) : void 0
        }
    }),
    t = function() {
        var t;
        return t = $("<textarea>").css({
            position: "fixed",
            top: 0,
            left: 0,
            opacity: 0
        }),
        $(document.body).append(t),
        t.focus(),
        function() {
            return t.blur().remove().val()
        }
    },
    e = null,
    $(document).on("pjax:click", ".js-show-file-finder",
    function() {
        return e = t()
    }),
    $(document).on("pjax:end", "#js-repo-pjax-container",
    function() {
        var t;
        return e ? ((t = e()) && n(t), e = null) : void 0
    }),
    $.pageUpdate(function() {
        var t, e, n, i;
        for (i = $(this).find(".js-tree-finder-field"), e = 0, n = i.length; n > e; e++) t = i[e],
        s(t)
    })
}.call(this),
function() {
    var t, e, n, s, i;
    s = function() {
        return $("body").addClass("is-sending"),
        $("body").removeClass("is-sent is-not-sent")
    },
    i = function() {
        return $("body").addClass("is-sent"),
        $("body").removeClass("is-sending")
    },
    n = function(t) {
        return t.responseText.length && $(".js-sms-error").text(t.responseText),
        $("body").addClass("is-not-sent"),
        $("body").removeClass("is-sending")
    },
    t = function(t) {
        return s(),
        $.ajax({
            url: t,
            type: "POST",
            success: i,
            error: n
        }),
        !1
    },
    $(document).on("click", ".js-resend-auth-code",
    function() {
        return t("/sessions/two_factor/resend")
    }),
    $(document).on("click", ".js-send-fallback-auth-code",
    function() {
        return t("/sessions/two_factor/send_fallback")
    }),
    $(document).on("click", ".js-send-two-factor-code",
    function() {
        var t, e, r, a, o;
        return t = $(this).closest("form"),
        e = t.find(".js-country-code-select").val(),
        r = t.find(".js-sms-number").val(),
        a = "" + e + " " + r,
        o = t.find(".js-two-factor-secret").val(),
        t.find("input,button,select").prop("disabled", !0),
        s(),
        $.ajax({
            url: "/settings/two_factor_authentication/send_sms",
            type: "POST",
            data: {
                number: a,
                two_factor_secret: o
            },
            success: function() {
                return i(),
                t.find(".js-2fa-enable").prop("disabled", !1),
                t.find(".js-2fa-confirm").prop("disabled", !0),
                t.find(".js-2fa-otp").focus()
            },
            error: function(e) {
                return n(e),
                t.find(".js-2fa-enable").prop("disabled", !0),
                t.find(".js-2fa-confirm").prop("disabled", !1)
            }
        }),
        !1
    }),
    $(document).on("click", "button.js-2fa-enable",
    function() {
        var t;
        return t = $(this).closest("form"),
        t.find("input,button,select").prop("disabled", !1)
    }),
    $(document).on("click", ".js-set-two-factor-fallback",
    function() {
        var t, n, s;
        return t = $(this).closest(".form"),
        n = t.find(".js-fallback-country-code-select").val(),
        s = t.find(".js-sms-fallback").val(),
        e(n, s)
    }),
    e = function(t, e) {
        return $("body").addClass("is-setting"),
        $("body").removeClass("is-set is-not-set"),
        "" !== e && (e = t + " " + e),
        $.ajax({
            url: "/settings/two_factor_authentication/backup_number",
            type: "POST",
            data: {
                number: e
            },
            success: function() {
                return $("body").addClass("is-set"),
                $("body").removeClass("is-setting"),
                "" === e ? $(".set-message").html("Removed!") : $(".set-message").html("Set! You should receive a confirmation SMS shortly.")
            },
            error: function(t) {
                return t.responseText.length && $(".js-fallback-error-message").text(t.responseText),
                $("body").addClass("is-not-set"),
                $("body").removeClass("is-setting")
            }
        }),
        !1
    },
    $(document).on("ajaxBeforeSend", ".js-add-yubicat",
    function() {
        return $(this).find("input").prop("disabled", !0)
    }),
    $(document).on("ajaxSuccess", ".js-yubicat-box",
    function() {
        return $(this).find(".js-yubicat-error").hide(),
        $(this).find(".js-add-yubicat input").prop("disabled", !1)
    }),
    $(document).on("ajaxError", ".js-yubicat-box",
    function(t, e) {
        var n;
        return $(this).find(".js-add-yubicat input").prop("disabled", !1).val(""),
        n = $(this).find(".js-yubicat-error"),
        422 === e.status && "" !== e.responseText.replace(/\s/, "") ? n.html(e.responseText) : n.html("There was an error. Refresh the page and try again."),
        n.show(),
        !1
    }),
    $(document).on("ajaxSuccess", ".js-delete-yubicat",
    function() {
        return $(this).closest("li").remove()
    }),
    $(document).on("ajaxSuccess", ".js-add-yubicat",
    function(t, e) {
        var n, s, i;
        return $(this).find("input").val(""),
        s = $(this).closest("ul").find(".js-yubicat-template").clone(),
        n = s.find("a"),
        i = n.attr("href").replace("deviceId", e.responseText),
        n.attr("href", i),
        s.find("code").html(e.responseText),
        s.removeClass("yubicat-template"),
        $(this).closest("li").before(s)
    })
}.call(this),
function() {
    $(document).on("click", ".js-toggle-recovery",
    function() {
        return $(".recovery-codes").toggleClass("is-hidden"),
        $('form[action="/sessions/two_factor"]').toggleClass("is-hidden")
    })
}.call(this),
function() {
    $(document).on("ajaxSend", ".js-restore-user",
    function() {
        return $(this).find(".minibutton").addClass("disabled")
    }),
    $(document).on("ajaxComplete", ".js-restore-user",
    function(t, e) {
        var n, s;
        return n = $(this),
        n.addClass("error"),
        s = 500 === e.status ? "Oops, something went wrong.": e.responseText,
        n.find(".js-message").show().html(s),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-user-sessions-revoke",
    function() {
        return GitHub.withSudo(function(t) {
            return function() {
                return $.ajax({
                    type: "DELETE",
                    url: t.href
                }).done(function() {
                    return $(t).closest("li").remove()
                })
            }
        } (this)),
        !1
    })
}.call(this),
function() {
    $(document).on("click", ".js-rendered-diff.collapsed .expandable",
    function(t) {
        return t.preventDefault(),
        $(t.target).closest(".collapsed").removeClass("collapsed")
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a, o, c;
    a = ["is-render-pending", "is-render-ready", "is-render-loading", "is-render-loaded"].reduce(function(t, e) {
        return "" + t + " " + e
    }),
    r = function(t) {
        var e;
        return e = t.data("timing"),
        null != e ? (e.load = e.hello = e.loading = e.loaded = e.ready = null, e.helloTimer && (clearTimeout(e.helloTimer), e.helloTimer = null), e.loadTimer ? (clearTimeout(e.loadTimer), e.loadTimer = null) : void 0) : void 0
    },
    n = function(t) {
        var e, n, s;
        if (!t.data("timing")) return e = 10,
        n = 45,
        s = {
            load: null,
            hello: null,
            loading: null,
            loaded: null,
            ready: null,
            helloTimer: null,
            loadTimer: null
        },
        s.load = Date.now(),
        s.helloTimer = setTimeout(c(t,
        function() {
            return ! s.hello
        }), 1e3 * e),
        s.loadTimer = setTimeout(c(t), 1e3 * n),
        t.data("timing", s)
    },
    o = function(t) {
        var e, n, s, i;
        if (t.length && (s = t.data("timing")) && (null == s.untimed || !s.untimed) && (e = t.find("iframe")).length && (i = e.get(0).contentWindow) && null != i.postMessage) return n = {
            type: "render:timing",
            body: {
                timing: s,
                format: t.data("type")
            }
        },
        i.postMessage(JSON.stringify(n), "*")
    },
    t = function(t) {
        var e, n, s, i;
        if (i = t.data("timing")) return o(t),
        e = i.hello - i.load,
        n = i.loading - i.hello,
        s = i.loaded - i.loading,
        debug("Render init delay: " + e + "ms Render ready: " + n + "ms Load Time: " + s + "ms")
    },
    i = function(t) {
        return t.addClass("is-render-requested")
    },
    s = function(t, e) {
        return t.removeClass(a),
        t.addClass("is-render-failed"),
        null != e && t.addClass("is-render-failed-" + e),
        r(t)
    },
    c = function(t, e) {
        return null == e && (e = function() {
            return ! 0
        }),
        function() {
            var n;
            if (t.is($.visible) && !t.hasClass("is-render-ready") && !t.hasClass("is-render-failed") && !t.hasClass("is-render-failed-fatally") && e()) return (n = t.data("timing")) ? (debug("Render timeout: " + JSON.stringify(n) + " Now: " + Date.now()), s(t)) : debug("No timing data on $:", t)
        }
    },
    $.pageUpdate(function() {
        return $(this).find(".js-render-target").each(function() {
            var t, e;
            return t = $(this),
            (null != (e = t.data("timing")) ? e.load: 0) ? void 0 : (r(t), n(t), t.find(".render-viewer-trigger").length ? t.find(".render-viewer-trigger").on("click",
            function(e) {
                return e.preventDefault(),
                i(t)
            }) : (t.addClass("is-render-automatic"), i(t)))
        })
    }),
    e = function(t) {
        var e;
        return e = ".js-render-target",
        t ? $("" + e + "[data-identity='" + t + "']") : $(e)
    },
    $(window).on("message",
    function(n) {
        var i, o, c, l, u, d, h, f, m, p, g, v, $;
        if (g = n.originalEvent, c = g.data, d = g.origin, c && d && (v = function() {
            try {
                return JSON.parse(c)
            } catch(t) {
                return n = t,
                c
            }
        } (), p = v.type, l = v.identity, o = v.body, h = v.payload, p && o && 1 === (i = e(l)).length && (f = i.data("timing") || {
            untimed: !0
        }) && d === i.data("host") && "render" === p)) switch (o) {
        case "hello":
            if (f.hello = Date.now(), f.loading = f.loaded = null, u = {
                type: "render:cmd",
                body: {
                    cmd: "branding",
                    branding: !1
                }
            },
            m = null != ($ = i.find("iframe").get(0)) ? $.contentWindow: void 0, "function" == typeof m.postMessage && m.postMessage(JSON.stringify(u), "*"), i.data("local")) return u = {
                type: "render:data",
                body: window.editor.code()
            },
            "function" == typeof m.postMessage ? m.postMessage(JSON.stringify(u), "*") : void 0;
            break;
        case "error":
            return s(i);
        case "error:fatal":
            return s(i, "fatal");
        case "loading":
            return i.removeClass(a),
            i.addClass("is-render-loading"),
            f.loading = Date.now();
        case "loaded":
            return i.removeClass(a),
            i.addClass("is-render-loaded"),
            f.loaded = Date.now();
        case "ready":
            if (i.removeClass(a), i.addClass("is-render-ready"), f.ready = Date.now(), null != (null != h ? h.height: void 0) && i.height(h.height), null == f.untimed || !f.untimed) return t(i),
            r(i);
            break;
        default:
            return debug("Unknown message [" + p + "]=>'" + o + "'")
        }
    })
}.call(this),
function() {
    $(document).on("click", ".js-toggle-lang-stats",
    function(t) {
        var e, n;
        return $(".js-stats-switcher-viewport").toggleClass("is-revealing-lang-stats"),
        n = $(this).closest(".tooltipped").attr("aria-label"),
        e = "",
        e = n.match("Show") ? n.replace("Show", "Hide") : n.replace("Hide", "Show"),
        $(".js-toggle-lang-stats").closest(".tooltipped").attr("aria-label", e),
        $(this).trigger("mouseover"),
        t.preventDefault()
    })
}.call(this),
function() {
    var t, e;
    e = null,
    $(document).on("autocomplete:search", ".js-repository-new-collab-field",
    function() {
        return e && e.abort(),
        "" === $(this).val() ? ($(".js-new-collab-autocomplete-result-list").empty(), $(".js-new-collab-autocomplete-results").trigger("autocomplete:change"), void 0) : e = $.ajax({
            type: "GET",
            data: {
                q: $(this).val()
            },
            url: "/autocomplete/users",
            dataType: "html",
            success: function(t) {
                return e = null,
                $(".js-new-collab-autocomplete-result-list").html(t),
                $(".js-new-collab-autocomplete-results").trigger("autocomplete:change")
            }
        })
    }),
    $(document).on("autocomplete:autocompleted:changed", ".js-repository-new-collab-field",
    function() {
        var t;
        return t = $(this).closest("form").find(".js-add-new-collab"),
        $(this).attr("data-autocompleted") ? t.removeAttr("disabled") : t.attr("disabled", "disabled")
    }),
    t = function(t) {
        return t ? $(".js-collab-error").text(t).show() : $(".js-collab-error").hide()
    },
    $(document).on("submit", ".js-add-collab-form",
    function(e) {
        var n, s;
        return e.preventDefault(),
        n = $(".js-repository-new-collab-field"),
        s = n.val(),
        s && n.attr("data-autocompleted") ? (t(), $.ajax({
            url: this.action,
            data: {
                member: s
            },
            type: "POST",
            dataType: "json",
            success: function(e) {
                return n.val(""),
                e.error ? t(e.error) : $(".js-collab-list").append(e.html)
            },
            error: function() {
                return t("An unidentified error occurred, try again?")
            }
        })) : !1
    }),
    $(document).on("submit", ".js-add-team-form",
    function(e) {
        var n, s;
        return e.preventDefault(),
        n = $(".js-repository-new-team-select"),
        s = n.val(),
        "" === s ? (t("You must select a team"), !1) : (t(), $.ajax({
            url: this.action,
            data: {
                team: s
            },
            type: "POST",
            dataType: "json",
            success: function(e) {
                return n.val(""),
                e.error ? t(e.error) : $(".js-repo-team-list").append(e.html)
            },
            error: function() {
                return t("An unidentified error occurred, try again?")
            }
        }))
    }),
    $(document).on("click", ".js-remove-repo-access",
    function(e) {
        var n;
        return e.preventDefault(),
        t(),
        n = $(this).closest(".js-repo-access-entry"),
        $.ajax({
            type: "DELETE",
            url: this.href,
            success: function() {
                return n.remove()
            },
            error: function() {
                return t("Sorry, we couldnâ€™t remove access. Please try again.")
            }
        })
    })
}.call(this),
function() {
    $(document).on("change", ".js-repo-default-branch",
    function() {
        var t, e, n;
        return e = $(this),
        t = $(this).parents("dl.form"),
        n = e.val(),
        t.removeClass("successful").removeClass("errored").addClass("loading"),
        $.ajax({
            type: "PUT",
            url: t.closest("form").attr("action"),
            data: {
                field: "repository_default_branch",
                value: n
            },
            complete: function() {
                return t.removeClass("loading")
            },
            success: function() {
                return t.addClass("successful")
            },
            error: function() {
                return t.addClass("errored"),
                e.val(n)
            }
        })
    }),
    $(document).on("change", ".js-repo-feature-checkbox",
    function() {
        var t, e;
        return t = this,
        e = $(this).closest(".addon"),
        e.removeClass("success").removeClass("error").addClass("loading"),
        $.ajax({
            type: "PUT",
            url: e.closest("form").attr("action"),
            data: {
                field: t.name,
                value: t.checked ? 1 : 0
            },
            success: function(t) {
                return e.removeClass("loading").addClass("success"),
                /^\s*</.test(t) ? ($(".repo-nav").replaceWith(t), $(".repo-nav").pageUpdate()) : void 0
            },
            error: function() {
                return t.checked = !t.checked,
                e.removeClass("loading").addClass("error")
            }
        })
    })
}.call(this),
function() {
    $(document).on("click", ".js-notification-global-toggle",
    function() {
        var t, e, n;
        return n = $(this).attr("data-url"),
        t = this.checked,
        e = {},
        e[this.name] = t ? "1": "0",
        $.ajax({
            url: $(this).attr("data-url"),
            type: "PUT",
            data: e,
            success: function() {
                return t ? $(this).parent("p").removeClass("ignored") : $(this).parent("p").addClass("ignored")
            }
        })
    }),
    $(document).on("change", ".js-notifications-settings input[type=checkbox]",
    function() {
        var t;
        return t = $(this),
        t.parents("li").append('<img class="spinner" src="' + GitHub.Ajax.spinner + '" width="16" />'),
        $.ajax({
            url: t.parents(".js-notifications-settings").attr("data-toggle-url"),
            type: "POST",
            data: t.parents(".js-notifications-settings").serialize(),
            complete: function() {
                return t.parents("li").find("img").remove()
            }
        })
    }),
    $(document).on("ajaxSend", ".js-remove-item",
    function() {
        return $(this).spin().hide()
    }),
    $(document).on("ajaxComplete", ".js-remove-item",
    function() {
        return $(this).parents("li").stopSpin()
    }),
    $(document).on("ajaxSuccess", ".js-remove-item",
    function() {
        return $(this).parents("li").remove()
    }),
    $(document).on("ajaxSuccess", ".js-toggle-visibility",
    function(t, e, n, s) {
        return $("#settings-emails").children(".settings-email.primary").toggleClass("private", "private" === s.visibility)
    }),
    $(document).on("ajaxSend", ".js-remove-key",
    function() {
        return $(this).addClass("disabled").find("span").text("Deletingâ€¦")
    }),
    $(document).on("ajaxError", ".js-remove-key",
    function() {
        return $(this).removeClass("disabled").find("span").text("Error. Try again.")
    }),
    $(document).on("ajaxSuccess", ".js-remove-key",
    function() {
        return $(this).parents("li").remove(),
        0 === $(".js-ssh-keys-box li").length ? $(".js-no-ssh-keys").show() : void 0
    }),
    $(document).on("click", ".js-leave-collaborated-repo",
    function(t) {
        var e, n, s, i;
        return e = $(t.currentTarget),
        s = e.closest("[data-repo]").attr("data-repo"),
        i = $('ul.repositories li[data-repo="' + s + '"]'),
        n = e.parents("div.full-button"),
        n.html('<img src="' + GitHub.Ajax.spinner + '" width="16" />'),
        $.ajax({
            url: "/account/leave_repo/" + s,
            type: "POST",
            success: function() {
                return $.facebox.close(),
                i.fadeOut()
            },
            error: function() {
                return n.html('<img src="/images/modules/ajax/error.png">')
            }
        }),
        !1
    }),
    $(document).on("ajaxError", ".js-name-change-in-progress",
    function() {
        return $(".js-name-change-in-progress").hide(),
        $(".js-name-change-error").show()
    }),
    $(document).on("ajaxSuccess", ".js-unsubscribe-from-newsletter form",
    function() {
        return $(".js-unsubscribe-from-newsletter .message").toggle()
    }),
    $(document).on("click", ".js-show-new-ssh-key-form",
    function() {
        return $(".js-new-ssh-key-box").toggle().find(".js-ssh-key-title").focus(),
        !1
    }),
    $(document).on("click", ".js-revoke-access",
    function() {
        var t, e, n, s, i;
        return s = $(this).data("id"),
        i = $(this).data("type"),
        e = $(this).siblings(".js-delete-failed").addClass("hidden"),
        n = "[data-type=" + i + "][data-id=" + s + "]",
        t = $(".js-revoke-item").filter(n),
        $.ajax({
            url: $(this).data("path"),
            type: "DELETE",
            success: function() {
                return $.facebox.close(),
                t.remove()
            },
            error: function() {
                return e.removeClass("hidden")
            }
        }),
        !1
    }),
    $(document).on("click", ".js-delete-oauth-application-image",
    function() {
        var t, e, n;
        return t = $(this).closest(".js-uploadable-container"),
        t.removeClass("has-uploaded-logo"),
        e = t.find("img.js-image-field"),
        n = t.find("input.js-oauth-application-logo-id"),
        e.attr("src", ""),
        n.val(""),
        !1
    }),
    $(document).on("click", ".js-new-callback",
    function(t) {
        var e, n;
        return t.preventDefault(),
        e = $(t.currentTarget).closest(".js-callback-urls"),
        n = e.find(".js-callback-url").first().clone(),
        n.removeClass("is-default-callback"),
        n.find("input").val(""),
        e.addClass("has-many"),
        $(t.currentTarget).before(n)
    }),
    $(document).on("click", ".js-delete-callback",
    function(t) {
        var e, n;
        return t.preventDefault(),
        e = $(t.currentTarget).closest(".js-callback-urls"),
        $(t.currentTarget).closest(".js-callback-url").remove(),
        n = e.find(".js-callback-url"),
        n.length <= 1 ? e.removeClass("has-many") : void 0
    }),
    $(document).on("click", ".section-head",
    function() {
        return $(".section-nav").slideUp(200).addClass("collapsed"),
        $(this).next(".section-nav").slideDown(200).removeClass("collapsed")
    }),
    $(document).on("click", ".js-user-rename-warning-continue",
    function() {
        return $(".js-user-rename-warning, .js-user-rename-form").toggle(),
        !1
    })
}.call(this),
function() {
    $(document).on("submit", "#signup_form",
    function() {
        return $("#signup_button").attr("disabled", !0).find("span").text("Creating your GitHub account...")
    }),
    $.observe(".js-plan-choice:checked", {
        add: function() {
            return $(this).closest(".plan-row").addClass("selected")
        },
        remove: function() {
            return $(this).closest(".plan-row").removeClass("selected")
        }
    }),
    $.observe(".js-plan-row.selected", {
        add: function() {
            var t;
            return t = $(this).find(".js-choose-button"),
            t.text(t.attr("data-selected-text"))
        },
        remove: function() {
            var t;
            return t = $(this).find(".js-choose-button"),
            t.text(t.attr("data-default-text"))
        }
    }),
    $.observe(".js-plan-row.free-plan.selected", {
        add: function() {
            var t;
            return t = $("#js-signup-billing-fields"),
            t.data("contents", t.contents().detach())
        },
        remove: function() {
            var t, e;
            return t = $("#js-signup-billing-fields"),
            e = t.data("contents"),
            t.append(e)
        }
    }),
    $.observe(".js-setup-organization:checked", {
        add: function() {
            var t;
            return t = $(".js-choose-plan-submit"),
            t.attr("data-default-text") || t.attr("data-default-text", t.text()),
            t.text(t.attr("data-org-text"))
        },
        remove: function() {
            var t;
            return t = $(".js-choose-plan-submit"),
            t.text(t.attr("data-default-text"))
        }
    })
}.call(this),
function() {
    $(document).on("click", ".js-approve-ssh-key",
    function() {
        var t;
        return t = $(this),
        t.addClass("disabled").find("span").text("Approvingâ€¦"),
        $.ajax({
            url: t.attr("href"),
            type: "POST",
            success: function() {
                return t.parents("li").addClass("approved")
            },
            error: function() {
                return t.removeClass("disabled").find("span").text("Error. Try Again")
            }
        }),
        !1
    }),
    $(document).on("click", ".js-reject-ssh-key",
    function() {
        var t;
        return t = $(this),
        t.addClass("disabled").find("span").text("Rejectingâ€¦"),
        $.ajax({
            url: t.attr("href"),
            type: "DELETE",
            success: function() {
                return t.parents("li").addClass("rejected")
            },
            error: function() {
                return t.removeClass("disabled").find("span").text("Error. Try Again")
            }
        }),
        !1
    })
}.call(this),
function() { ! $.support.pjax || location.search || location.hash || $(function() {
        var t, e, n;
        return t = null != (n = document.getElementById("issues-dashboard")) ? n: document.getElementById("issues_list"),
        (e = $(t).attr("data-url")) ? window.history.replaceState(null, document.title, e) : void 0
    })
}.call(this),
function() {
    var t, e, n, s, i, r, a;
    $.support.pjax && (e = null, i = "last_pjax_request", r = "pjax_start", s = "pjax_end", n = function(t) {
        var n, s; (n = null != (s = t.relatedTarget) ? s.href: void 0) && (window.performance.mark(r), e = n)
    },
    a = function() {
        setImmediate(function() {
            var n, a, o;
            if (window.performance.getEntriesByName(r).length && (window.performance.mark(s), window.performance.measure(i, r, s), a = window.performance.getEntriesByName(i), n = a.pop().duration)) return o = {
                pjax: {
                    url: e,
                    ms: Math.round(n)
                }
            },
            $.ajax({
                url: "/_stats",
                type: "POST",
                data: o
            }),
            t()
        })
    },
    t = function() {
        window.performance.clearMarks(r),
        window.performance.clearMarks(s),
        window.performance.clearMeasures(i)
    },
    $(document).on("pjax:start", n), $(document).on("pjax:end", a))
}.call(this),
$.pageUpdate(function() {
    if (0 != $(".file .image").length) {
        var t = $(".file").has(".onion-skin"),
        e = [];
        $.each(t,
        function(n) {
            function s() {
                if (k++, a(), k >= C) {
                    var t = c.find(".progress");
                    t.is($.visible) ? t.fadeOut(250,
                    function() {
                        r()
                    }) : (t.hide(), r())
                }
            }
            function i(t) {
                var e = j.find(".active"),
                n = j.find(".active").first().index(),
                s = w.eq(n),
                i = j.children().eq(t);
                if (0 == i.hasClass("active") && 0 == i.hasClass("disabled")) {
                    if (e.removeClass("active"), i.addClass("active"), i.is($.visible)) {
                        var r = i.position(),
                        a = i.outerWidth(),
                        o = String(r.left + a / 2) + "px 0px";
                        j.css("background-image", "url(/images/modules/commit/menu_arrow.gif)"),
                        j.css("background-position", o)
                    }
                    k >= 2 && (animHeight = parseInt(w.eq(t).css("height")) + 127, c.css("height", animHeight), s.animate({
                        opacity: "hide"
                    },
                    250, "swing",
                    function() {
                        w.eq(t).fadeIn(250)
                    }))
                }
            }
            function r() {
                var t = 858,
                s = Math.max(S.width, _.width),
                r = Math.max(S.height, _.height),
                a = 0,
                h = 1;
                S.marginHoriz = Math.floor((s - S.width) / 2),
                S.marginVert = Math.floor((r - S.height) / 2),
                _.marginHoriz = Math.floor((s - _.width) / 2),
                _.marginVert = Math.floor((r - _.height) / 2),
                $.each($.getUrlVars(),
                function(t, n) {
                    n == c.attr("id") && (diffNum = parseInt(n.replace(/\D*/g, "")), x = $.getUrlVar(n)[0], a = $.getUrlVar(n)[1] / 100, e[diffNum].view = $.getUrlVar(n)[0], e[diffNum].pct = $.getUrlVar(n)[1], e[diffNum].changed = !0)
                });
                var f = 1;
                s > (t - 30) / 2 && (f = (t - 30) / 2 / s),
                m.attr({
                    width: S.width * f,
                    height: S.height * f
                }),
                p.attr({
                    width: _.width * f,
                    height: _.height * f
                }),
                l.find(".deleted-frame").css({
                    margin: S.marginVert * f + "px " + S.marginHoriz * f + "px",
                    width: S.width * f + 2,
                    height: S.height * f + 2
                }),
                l.find(".added-frame").css({
                    margin: _.marginVert * f + "px " + _.marginHoriz * f + "px",
                    width: _.width * f + 2,
                    height: _.height * f + 2
                }),
                l.find(".aWMeta").eq(0).text(_.width + "px"),
                l.find(".aHMeta").eq(0).text(_.height + "px"),
                l.find(".dWMeta").eq(0).text(S.width + "px"),
                l.find(".dHMeta").eq(0).text(S.height + "px"),
                _.width != S.width && (l.find(".aWMeta").eq(0).addClass("a-green"), l.find(".dWMeta").eq(0).addClass("d-red")),
                _.height != S.height && (l.find(".aHMeta").eq(0).addClass("a-green"), l.find(".dHMeta").eq(0).addClass("d-red"));
                var w, C = 1;
                s > t - 12 && (C = (t - 12) / s),
                w = 0,
                w = s * C + 3,
                g.attr({
                    width: S.width * C,
                    height: S.height * C
                }),
                v.attr({
                    width: _.width * C,
                    height: _.height * C
                }),
                u.find(".deleted-frame").css({
                    margin: S.marginVert * C + "px " + S.marginHoriz * C + "px",
                    width: S.width * C + 2,
                    height: S.height * C + 2
                }),
                u.find(".added-frame").css({
                    margin: _.marginVert * C + "px " + _.marginHoriz * C + "px",
                    width: _.width * C + 2,
                    height: _.height * C + 2
                }),
                u.find(".swipe-shell").css({
                    width: s * C + 3 + "px",
                    height: r * C + 4 + "px"
                }),
                u.find(".swipe-frame").css({
                    width: s * C + 18 + "px",
                    height: r * C + 30 + "px"
                }),
                u.find(".swipe-bar").css("left", a * w + "px"),
                c.find(".swipe .swipe-shell").css("width", w - w * a),
                u.find(".swipe-bar").on("mousedown",
                function(t) {
                    var s = $(this),
                    i = $(this).parent(),
                    r = i.width() - s.width();
                    t.preventDefault(),
                    $("body").css({
                        cursor: "pointer"
                    }),
                    $(document).on("mousemove.swipe",
                    function(t) {
                        t.preventDefault();
                        var a = t.clientX - i.offset().left;
                        0 > a && (a = 0),
                        a > r && (a = r),
                        s.css({
                            left: a
                        });
                        var o = Math.round(1e4 * (a / (parseInt(c.find(".swipe-frame").css("width")) - 15))) / 1e4;
                        c.find(".swipe .swipe-shell").css("width", w - w * o),
                        e[n].pct = 100 * o,
                        e[n].changed = !0
                    }),
                    $(document).on("mouseup.swipe",
                    function() {
                        $(document).off(".swipe"),
                        $("body").css({
                            cursor: "auto"
                        }),
                        o()
                    })
                });
                var k = 1;
                s > t - 12 && (k = (t - 12) / s),
                y.attr({
                    width: S.width * k,
                    height: S.height * k
                }),
                b.attr({
                    width: _.width * k,
                    height: _.height * k
                }),
                d.find(".deleted-frame").css({
                    margin: S.marginVert * k + "px " + S.marginHoriz * k + "px",
                    width: S.width * k + 2,
                    height: S.height * k + 2
                }),
                d.find(".added-frame").css({
                    margin: _.marginVert * k + "px " + _.marginHoriz * k + "px",
                    width: _.width * k + 2,
                    height: _.height * k + 2
                }),
                d.find(".onion-skin-frame").css({
                    width: s * k + 4 + "px",
                    height: r * k + 30 + "px"
                }),
                c.find(".dragger").css("left", 262 * h + "px"),
                c.find(".onion-skin .added-frame").css("opacity", h),
                c.find(".onion-skin .added-frame img").css("opacity", h),
                c.find(".dragger").on("mousedown",
                function(t) {
                    var s = $(this),
                    i = $(this).parent(),
                    r = i.width() - s.width();
                    t.preventDefault(),
                    $("body").css({
                        cursor: "pointer"
                    }),
                    $(document).on("mousemove.dragger",
                    function(t) {
                        t.preventDefault();
                        var a = t.clientX - i.offset().left;
                        0 > a && (a = 0),
                        a > r && (a = r),
                        s.css({
                            left: a
                        });
                        var o = Math.round(100 * (a / 262)) / 100;
                        c.find(".onion-skin .added-frame").css("opacity", o),
                        c.find(".onion-skin .added-frame img").css("opacity", o),
                        e[n].pct = 100 * o,
                        e[n].changed = !0
                    }),
                    $(document).on("mouseup.dragger",
                    function() {
                        $(document).off(".dragger"),
                        $("body").css({
                            cursor: "auto"
                        }),
                        o()
                    })
                }),
                l.css("height", r * f + 30),
                u.css("height", r * C + 30),
                d.css("height", r * C + 30),
                j.children().removeClass("disabled"),
                i(x)
            }
            function a() {
                var t = 100 * (k / C) + "%";
                c.find(".progress-bar").animate({
                    width: t
                },
                250, "swing")
            }
            function o() {
                var t = "?";
                $.each(e,
                function(e, n) {
                    1 == n.changed && (0 != e && (t += "&"), t += "diff-" + e + "=" + n.view + "-" + Math.round(n.pct))
                }),
                window.history && window.history.replaceState && window.history.replaceState({},
                "", t)
            }
            if (!$(this).data("image-diff-installed")) {
                var c = t.eq(n),
                l = c.find(".two-up").eq(0),
                u = c.find(".swipe").eq(0),
                d = c.find(".onion-skin").eq(0),
                h = c.find(".deleted"),
                f = c.find(".added"),
                m = h.eq(0),
                p = f.eq(0),
                g = h.eq(1),
                v = f.eq(1),
                y = h.eq(2),
                b = f.eq(2),
                j = c.find("ul.view-modes-menu"),
                w = c.find(".view"),
                x = 0,
                C = c.find(".asset").length,
                k = 0,
                S = new Image,
                _ = new Image;
                e.push({
                    name: c.attr("id"),
                    view: 0,
                    pct: 0,
                    changed: !1
                }),
                $(this).data("image-diff-installed", !0),
                c.find(".two-up").hide(),
                c.find(".two-up p").removeClass("hidden"),
                c.find(".progress").removeClass("hidden"),
                c.find(".view-modes").removeClass("hidden"),
                S.src = c.find(".deleted").first().attr("src"),
                _.src = c.find(".added").first().attr("src"),
                m.attr("src", S.src).load(function() {
                    s()
                }),
                p.attr("src", _.src).load(function() {
                    s()
                }),
                g.attr("src", S.src).load(function() {
                    s()
                }),
                v.attr("src", _.src).load(function() {
                    s()
                }),
                y.attr("src", S.src).load(function() {
                    s()
                }),
                b.attr("src", _.src).load(function() {
                    s()
                });
                var T = !0;
                j.children("li").click(function() {
                    var t = $(this).index();
                    1 != t && 2 != t || !T || (T = !1),
                    i(t),
                    e[n].view = t,
                    e[n].changed = !0,
                    o()
                }),
                $.extend({
                    getUrlVars: function() {
                        for (var t, e = [], n = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&"), s = 0; s < n.length; s++) t = n[s].split("="),
                        t[1] && (t[1] = t[1].split("-")),
                        e.push(t[0]),
                        e[t[0]] = t[1];
                        return e
                    },
                    getUrlVar: function(t) {
                        return $.getUrlVars()[t]
                    }
                })
            }
        })
    }
}),
$(function() {
    function t() {
        var n = $("#current-version").val();
        n && $.get("_current",
        function(s) {
            n == s ? setTimeout(t, 5e3) : e || ($("#gollum-error-message").text("Someone has edited the wiki since you started. Please reload this page and re-apply your changes."), $("#gollum-error-message").show(), $("#gollum-editor-submit").attr("disabled", "disabled"), $("#gollum-editor-submit").attr("value", "Cannot Save, Someone Else Has Edited"))
        })
    }
    $("#see-more-elsewhere").click(function() {
        return $(".seen-elsewhere").show(),
        $(this).remove(),
        !1
    });
    var e = !1;
    $("#gollum-editor-body").each(t),
    $("#gollum-editor-submit").click(function() {
        e = !0
    });
    var n = [];
    $("form#history input[type=submit]").attr("disabled", !0),
    $("form#history input[type=checkbox]").change(function() {
        var t = $(this).val(),
        e = $.inArray(t, n);
        if (e > -1) n.splice(e, 1);
        else if (n.push(t), n.length > 2) {
            var s = n.shift();
            $("input[value=" + s + "]").prop("checked", !1)
        }
        if ($("form#history tr.commit").removeClass("selected"), $("form#history input[type=submit]").attr("disabled", !0), 2 == n.length) {
            $("form#history input[type=submit]").attr("disabled", !1);
            var i = !1;
            $("form#history tr.commit").each(function() {
                i && $(this).addClass("selected"),
                $(this).find("input:checked").length > 0 && (i = !i),
                i && $(this).addClass("selected")
            })
        }
    })
});