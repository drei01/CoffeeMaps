/*!
  * Reqwest! A general purpose XHR connection manager
  * (c) Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!(function(a, b) {
    typeof module != 'undefined'
        ? (module.exports = b())
        : typeof define == 'function' && define.amd ? define(a, b) : (this[a] = b());
})('reqwest', function() {
    function handleReadyState(a, b, c) {
        return function() {
            a && a[readyState] == 4 && (twoHundo.test(a.status) ? b(a) : c(a));
        };
    }
    function setHeaders(a, b) {
        var c = b.headers || {},
            d;
        (c.Accept = c.Accept || defaultHeaders.accept[b.type] || defaultHeaders.accept['*']),
            !b.crossOrigin && !c[requestedWith] && (c[requestedWith] = defaultHeaders.requestedWith),
            c[contentType] || (c[contentType] = b.contentType || defaultHeaders.contentType);
        for (d in c) c.hasOwnProperty(d) && a.setRequestHeader(d, c[d]);
    }
    function generalCallback(a) {
        lastValue = a;
    }
    function urlappend(a, b) {
        return a + (/\?/.test(a) ? '&' : '?') + b;
    }
    function handleJsonp(a, b, c, d) {
        var e = uniqid++,
            f = a.jsonpCallback || 'callback',
            g = a.jsonpCallbackName || 'reqwest_' + e,
            h = new RegExp('((^|\\?|&)' + f + ')=([^&]+)'),
            i = d.match(h),
            j = doc.createElement('script'),
            k = 0;
        i ? (i[3] === '?' ? (d = d.replace(h, '$1=' + g)) : (g = i[3])) : (d = urlappend(d, f + '=' + g)),
            (win[g] = generalCallback),
            (j.type = 'text/javascript'),
            (j.src = d),
            (j.async = !0),
            typeof j.onreadystatechange != 'undefined' && ((j.event = 'onclick'), (j.htmlFor = j.id = '_reqwest_' + e)),
            (j.onload = j.onreadystatechange = function() {
                if ((j[readyState] && j[readyState] !== 'complete' && j[readyState] !== 'loaded') || k) return !1;
                (j.onload = j.onreadystatechange = null),
                    j.onclick && j.onclick(),
                    a.success && a.success(lastValue),
                    (lastValue = undefined),
                    head.removeChild(j),
                    (k = 1);
            }),
            head.appendChild(j);
    }
    function getRequest(a, b, c) {
        var d = (a.method || 'GET').toUpperCase(),
            e = typeof a == 'string' ? a : a.url,
            f =
                a.processData !== !1 && a.data && typeof a.data != 'string'
                    ? reqwest.toQueryString(a.data)
                    : a.data || null,
            g;
        return (
            (a.type == 'jsonp' || d == 'GET') && f && ((e = urlappend(e, f)), (f = null)),
            a.type == 'jsonp'
                ? handleJsonp(a, b, c, e)
                : ((g = xhr()),
                  g.open(d, e, !0),
                  setHeaders(g, a),
                  (g.onreadystatechange = handleReadyState(g, b, c)),
                  a.before && a.before(g),
                  g.send(f),
                  g)
        );
    }
    function Reqwest(a, b) {
        (this.o = a), (this.fn = b), init.apply(this, arguments);
    }
    function setType(a) {
        var b = a.match(/\.(json|jsonp|html|xml)(\?|$)/);
        return b ? b[1] : 'js';
    }
    function init(o, fn) {
        function complete(a) {
            o.timeout && clearTimeout(self.timeout), (self.timeout = null), o.complete && o.complete(a);
        }
        function success(resp) {
            var r = resp.responseText;
            if (r)
                switch (type) {
                    case 'json':
                        try {
                            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')');
                        } catch (err) {
                            return error(resp, 'Could not parse JSON in response', err);
                        }
                        break;
                    case 'js':
                        resp = eval(r);
                        break;
                    case 'html':
                        resp = r;
                }
            fn(resp), o.success && o.success(resp), complete(resp);
        }
        function error(a, b, c) {
            o.error && o.error(a, b, c), complete(a);
        }
        (this.url = typeof o == 'string' ? o : o.url), (this.timeout = null);
        var type = o.type || setType(this.url),
            self = this;
        (fn = fn || function() {}),
            o.timeout &&
                (this.timeout = setTimeout(function() {
                    self.abort();
                }, o.timeout)),
            (this.request = getRequest(o, success, error));
    }
    function reqwest(a, b) {
        return new Reqwest(a, b);
    }
    function normalize(a) {
        return a ? a.replace(/\r?\n/g, '\r\n') : '';
    }
    function serial(a, b) {
        var c = a.name,
            d = a.tagName.toLowerCase(),
            e = function(a) {
                a &&
                    !a.disabled &&
                    b(c, normalize(a.attributes.value && a.attributes.value.specified ? a.value : a.text));
            };
        if (a.disabled || !c) return;
        switch (d) {
            case 'input':
                if (!/reset|button|image|file/i.test(a.type)) {
                    var f = /checkbox/i.test(a.type),
                        g = /radio/i.test(a.type),
                        h = a.value;
                    ((!f && !g) || a.checked) && b(c, normalize(f && h === '' ? 'on' : h));
                }
                break;
            case 'textarea':
                b(c, normalize(a.value));
                break;
            case 'select':
                if (a.type.toLowerCase() === 'select-one') e(a.selectedIndex >= 0 ? a.options[a.selectedIndex] : null);
                else for (var i = 0; a.length && i < a.length; i++) a.options[i].selected && e(a.options[i]);
        }
    }
    function eachFormElement() {
        var a = this,
            b,
            c,
            d,
            e = function(b, c) {
                for (var e = 0; e < c.length; e++) {
                    var f = b[byTag](c[e]);
                    for (d = 0; d < f.length; d++) serial(f[d], a);
                }
            };
        for (c = 0; c < arguments.length; c++)
            (b = arguments[c]),
                /input|select|textarea/i.test(b.tagName) && serial(b, a),
                e(b, ['input', 'select', 'textarea']);
    }
    function serializeQueryString() {
        return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments));
    }
    function serializeHash() {
        var a = {};
        return (
            eachFormElement.apply(function(b, c) {
                b in a ? (a[b] && !isArray(a[b]) && (a[b] = [a[b]]), a[b].push(c)) : (a[b] = c);
            }, arguments),
            a
        );
    }
    var win = window,
        doc = document,
        twoHundo = /^20\d$/,
        byTag = 'getElementsByTagName',
        readyState = 'readyState',
        contentType = 'Content-Type',
        requestedWith = 'X-Requested-With',
        head = doc[byTag]('head')[0],
        uniqid = 0,
        lastValue,
        xmlHttpRequest = 'XMLHttpRequest',
        isArray =
            typeof Array.isArray == 'function'
                ? Array.isArray
                : function(a) {
                      return a instanceof Array;
                  },
        defaultHeaders = {
            contentType: 'application/x-www-form-urlencoded',
            accept: {
                '*': 'text/javascript, text/html, application/xml, text/xml, */*',
                xml: 'application/xml, text/xml',
                html: 'text/html',
                text: 'text/plain',
                json: 'application/json, text/javascript',
                js: 'application/javascript, text/javascript',
            },
            requestedWith: xmlHttpRequest,
        },
        xhr = win[xmlHttpRequest]
            ? function() {
                  return new XMLHttpRequest();
              }
            : function() {
                  return new ActiveXObject('Microsoft.XMLHTTP');
              };
    return (
        (Reqwest.prototype = {
            abort: function() {
                this.request.abort();
            },
            retry: function() {
                init.call(this, this.o, this.fn);
            },
        }),
        (reqwest.serializeArray = function() {
            var a = [];
            return (
                eachFormElement.apply(function(b, c) {
                    a.push({ name: b, value: c });
                }, arguments),
                a
            );
        }),
        (reqwest.serialize = function() {
            if (arguments.length === 0) return '';
            var a,
                b,
                c = Array.prototype.slice.call(arguments, 0);
            return (
                (a = c.pop()),
                a && a.nodeType && c.push(a) && (a = null),
                a && (a = a.type),
                a == 'map'
                    ? (b = serializeHash)
                    : a == 'array' ? (b = reqwest.serializeArray) : (b = serializeQueryString),
                b.apply(null, c)
            );
        }),
        (reqwest.toQueryString = function(a) {
            var b = '',
                c,
                d = encodeURIComponent,
                e = function(a, c) {
                    b += d(a) + '=' + d(c) + '&';
                };
            if (isArray(a)) for (c = 0; a && c < a.length; c++) e(a[c].name, a[c].value);
            else
                for (var f in a) {
                    if (!Object.hasOwnProperty.call(a, f)) continue;
                    var g = a[f];
                    if (isArray(g)) for (c = 0; c < g.length; c++) e(f, g[c]);
                    else e(f, a[f]);
                }
            return b.replace(/&$/, '').replace(/%20/g, '+');
        }),
        (reqwest.compat = function(a, b) {
            return (
                a &&
                    (a.type && (a.method = a.type) && delete a.type,
                    a.dataType && (a.type = a.dataType),
                    a.jsonpCallback && (a.jsonpCallbackName = a.jsonpCallback) && delete a.jsonpCallback,
                    a.jsonp && (a.jsonpCallback = a.jsonp)),
                new Reqwest(a, b)
            );
        }),
        reqwest
    );
});
/*!
 * Foursquare Venues API v1.0
 * https://github.com/sydcanem/foursquare-venues
 *
 * Copyright 2012, @sydcanem
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
window.foursquare = foursquare;
var foursquare = function(e) {
    'use strict';
    var t = {},
        n = e.client_id,
        r = e.client_secret;
    var i, s, o, u;
    u = new Date();
    o = u.getMonth() + 1;
    if (o < 10) {
        o = '0' + o;
    }
    s = u.getDate();
    if (s < 10) {
        s = '0' + s;
    }
    i = u.getFullYear() + '' + o + '' + s;
    t.search = function(e, t) {
        function o(e) {
            if (e.meta.code !== 200) {
                t(true, null, null);
            }
            t(null, e, e.response.venues);
        }
        var s = 'https://api.foursquare.com/v2/venues/search?';
        s +=
            (e.ll ? '&ll=' + e.ll : '') +
            (e.near ? '&near=' + e.near : '') +
            (e.llAcc ? '&llAcc=' + e.llAcc : '') +
            (e.alt ? '&alt=' + e.alt : '') +
            (e.altAcc ? '&altAcc=' + e.altAcc : '') +
            (e.query ? '&query=' + e.query : '') +
            (e.limit ? '&limit=' + e.limit : '') +
            (e.intent ? '&intent=' + e.intent : '') +
            (e.radius ? '&radius=' + e.radius : '') +
            (e.sw ? '&sw=' + e.sw : '') +
            (e.ne ? '&ne=' + e.ne : '') +
            (e.categoryId ? '&categoryId=' + e.categoryId : '') +
            (e.url ? '&url=' + e.url : '') +
            (e.providerId ? '&providerId=' + e.providerId : '') +
            (e.linkedId ? '&linkedId=' + e.linkedId : '') +
            '&client_id=' +
            n +
            '&client_secret=' +
            r +
            '&v=' +
            i;
        return reqwest({ url: s, type: 'json', crossOrigin: true, success: o });
    };
    t.explore = function(e, t) {
        function o(e) {
            if (e.meta.code !== 200) {
                t(true, null, null);
            }
            t(null, e, e.response.groups[0]);
        }
        var s = '//api.foursquare.com/v2/venues/explore?';
        s +=
            (e.ll ? '&ll=' + e.ll : '') +
            (e.section ? '&section=' + e.section : '') +
            (e.near ? '&near=' + e.near : '') +
            (e.llAcc ? '&llAcc=' + e.llAcc : '') +
            (e.alt ? '&alt=' + e.alt : '') +
            (e.altAcc ? '&altAcc=' + e.altAcc : '') +
            (e.query ? '&query=' + e.query : '') +
            (e.limit ? '&limit=' + e.limit : '') +
            (e.radius ? '&radius=' + e.radius : '') +
            '&client_id=' +
            n +
            '&client_secret=' +
            r +
            '&v=' +
            i;
        return reqwest({ url: s, type: 'json', crossOrigin: true, success: o });
    };
    return t;
};
/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!(function(a, b) {
    typeof module != 'undefined'
        ? (module.exports = b())
        : typeof define == 'function' && typeof define.amd == 'object' ? define(b) : (this[a] = b());
})('domready', function(a) {
    function m(a) {
        l = 1;
        while ((a = b.shift())) a();
    }
    var b = [],
        c,
        d = !1,
        e = document,
        f = e.documentElement,
        g = f.doScroll,
        h = 'DOMContentLoaded',
        i = 'addEventListener',
        j = 'onreadystatechange',
        k = 'readyState',
        l = /^loade|c/.test(e[k]);
    return (
        e[i] &&
            e[i](
                h,
                (c = function() {
                    e.removeEventListener(h, c, d), m();
                }),
                d
            ),
        g &&
            e.attachEvent(
                j,
                (c = function() {
                    /^c/.test(e[k]) && (e.detachEvent(j, c), m());
                })
            ),
        (a = g
            ? function(c) {
                  self != top
                      ? l ? c() : b.push(c)
                      : (function() {
                            try {
                                f.doScroll('left');
                            } catch (b) {
                                return setTimeout(function() {
                                    a(c);
                                }, 50);
                            }
                            c();
                        })();
              }
            : function(a) {
                  l ? a() : b.push(a);
              })
    );
});
L.OSMTileLayer = L.TileLayer.extend({
    initialize: function(name) {
        var url = '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.TileLayer.prototype.initialize.call(this, url, {
            minZoom: 7,
            maxZoom: 16,
            attribution:
                'Map data by <a href="//openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
        });
    },
});

var coffee = (function() {
    var redIcon = L.Icon.extend({
            iconUrl: 'js/leaflet/images/marker-red.png',
        }),
        fadedIcon = L.Icon.extend({
            iconUrl: 'marker-faded.png',
        });
    var map,
        markers_free,
        markers_paid,
        fsq,
        walk_time = 0,
        watchPosition,
        m,
        _lat,
        _lng,
        loading;
    return {
        init: function(ldng) {
            loading = {
                show: function() {
                    ldng.style.display = '';
                },
                hide: function() {
                    ldng.style.display = 'none';
                },
            };
            map = new L.Map('map');
            map.attributionControl.setPrefix(
                '<a href="//twitter.com/share" class="twitter-share-button" data-via="Matthew_Reid" data-count="none" data-dnt="true" data-text="Found a brew with #coffeemaps" url="' +
                    location.href +
                    '">Tweet this!</a>'
            );
            var layer = new L.OSMTileLayer();
            var pos = { lat: 0, long: 0 };
            if (typeof com != 'undefined') {
                pos = com.unitedCoders.geo.ll[0];
            }
            map.addLayer(layer).setView(new L.LatLng(pos.lat, pos.long), 15);
            map.on('moveend', function(e) {
                coffee.lookup();
            });
            markers_free = new L.LayerGroup([]);
            markers_paid = new L.LayerGroup([]);
            map.addLayer(markers_free);
            map.addLayer(markers_paid);
            fsq = foursquare({
                client_id: 'OYMV3I2NNWYNARULRR5XBMCGNWAZ0KOJY4WUUOLBY5NVRUW5',
                client_secret: 'KBTPU5JD1H45HYEU0OLNKP03ZHQFHOQLUS1KCQ13FJ22YVXQ',
            });
        },
        geocode: function() {
            if (watchPosition) {
                navigator.geolocation.clearWatch(watchPosition);
            }
            loading.show();
            var q = document.getElementById('q').value;
            reqwest({
                url: '//mapit.mysociety.org/postcode/' + encodeURIComponent(q),
                type: 'json',
                crossOrigin: true,
                success: function(data) {
                    loading.hide();
                    coffee.setLocation(data.wgs84_lat, data.wgs84_lon);
                },
            });
            return false;
        },
        geolocation: function() {
            var self = this;
            if (navigator && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        self.setLocation(position.coords.latitude, position.coords.longitude);
                        self.lookup();
                    },
                    function(error) {
                        if (typeof com != 'undefined') {
                            var pos = com.unitedCoders.geo.ll[0];
                            self.setLocation(pos.lat, pos.long);
                            self.lookup();
                        }
                    },
                    { maximumAge: 600000, timeout: 10000 }
                );

                watchPosition = navigator.geolocation.watchPosition(function(position) {
                    if (
                        _lat &&
                        _lng &&
                        self.lineDistance(_lat, position.coords.latitude, _lng, position.coords.longitude) < 100
                    ) {
                        return;
                    }
                    self.setLocation(position.coords.latitude, position.coords.longitude);
                    self.lookup();
                });
            } else if (typeof com != 'undefined') {
                var pos = com.unitedCoders.geo.ll[0];
                self.setLocation(pos.lat, pos.long);
                self.lookup();
            }
        },
        setLocation: function(lat, lng) {
            _lat = lat;
            _lng = lng;
            var l = new L.LatLng(lat, lng);
            if (m) {
                map.removeLayer(m);
            }
            m = new L.Marker(l, {
                icon: new redIcon(),
            });
            map.addLayer(m);
            map.setView(l, 15);
        },
        lookup: function() {
            var c = map.getCenter(),
                bb = map.getBounds().toBBoxString();

            loading.show();
            fsq.search({ ll: c.lat + ',' + c.lng, limit: '15', query: 'coffee' }, this.draw_markers);

            return false;
        },
        hide_paid: function() {
            map.removeLayer(markers_paid);
        },
        show_paid: function() {
            map.addLayer(markers_paid);
        },
        draw_markers: function(err, data, venues) {
            loading.hide();
            markers_free.clearLayers();
            markers_paid.clearLayers();
            var c = map.getCenter();
            venues.forEach(function(venue) {
                var location = venue.location;
                var mins = Math.round(location.distance / 83);

                if (walk_time != 0 && mins >= walk_time) {
                    return;
                }

                var info = '<strong>' + venue.name + '</strong>',
                    markers = markers_free,
                    marker_opt = {};
                var attr = [];

                if (location.address) {
                    attr.push(location.address);
                }

                if (venue.contact.formattedPhone) {
                    attr.push('<a href="tel:' + venue.contact.phone + '">' + venue.contact.formattedPhone + '</a>');
                }

                attr.push('Distance: ' + location.distance + ' m');

                attr.push('About ' + mins + ' mins walk');

                if (attr.length) {
                    info += '<br>' + attr.join('<br/> ');
                }
                var l = new L.LatLng(location.lat, location.lng),
                    m = new L.Marker(l, marker_opt).bindPopup(info);
                markers.addLayer(m);
            });
        },
        setDistance: function(mins) {
            walk_time = mins;
            this.lookup();
            return false;
        },
        lineDistance: function(lat1, lng1, lat2, lng2) {
            var xs = 0;
            var ys = 0;

            xs = lat2 - lat1;
            xs = xs * xs;

            ys = lng2 - lng1;
            ys = ys * ys;

            return Math.sqrt(xs + ys);
        },
    };
})();
domready(function() {
    var d = document;
    d.getElementById('filter').onsubmit = coffee.geocode;
});
