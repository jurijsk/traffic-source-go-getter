var ReferralDescriptor = (function () {
    function ReferralDescriptor(source, medium) {
        this.source = source;
        this.medium = medium;
    }
    return ReferralDescriptor;
}());
var QueryStringParams = (function () {
    function QueryStringParams(utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, gclsrc, dclid, fbclid, msclkid) {
        this.utm_source = utm_source;
        this.utm_medium = utm_medium;
        this.utm_campaign = utm_campaign;
        this.utm_term = utm_term;
        this.utm_content = utm_content;
        this.gclid = gclid;
        this.gclsrc = gclsrc;
        this.dclid = dclid;
        this.fbclid = fbclid;
        this.msclkid = msclkid;
    }
    return QueryStringParams;
}());
var TrafficData = (function () {
    function TrafficData(source, medium, campaign, term, content) {
        this.source = source;
        this.medium = medium;
        this.campaign = campaign;
        this.term = term;
        this.content = content;
    }
    TrafficData.sourceDirect = '(direct)';
    TrafficData.sourceGoogle = 'google';
    TrafficData.sourceBing = 'bing';
    TrafficData.mediumNone = '(none)';
    TrafficData.notSet = '(not set)';
    TrafficData.mediumCPC = 'cpc';
    TrafficData.mediumDisplay = 'display';
    TrafficData.gaDefaults = new TrafficData(TrafficData.sourceDirect, TrafficData.mediumNone, TrafficData.notSet, TrafficData.notSet, TrafficData.notSet);
    return TrafficData;
}());
var TrafficSourceGoGetter = (function () {
    function TrafficSourceGoGetter(options) {
        var _a;
        this.trafficData = null;
        this.debuging = false;
        this.propMap = {
            source: 'cs',
            medium: 'cm',
            campaign: 'cn',
            term: 'ck',
            content: 'cc'
        };
        this.USE_HOSTNAME = true;
        this.searchEngines = {
            'www.google.': TrafficData.sourceGoogle,
            'www.bing.': TrafficData.sourceBing,
            'www.baidu.': 'baidu',
            'www.yahoo.': this.USE_HOSTNAME,
            'yandex.': this.USE_HOSTNAME,
            'yahoo.': this.USE_HOSTNAME,
            'm.yahoo.': this.USE_HOSTNAME,
            'duckduckgo.com': this.USE_HOSTNAME,
            'www.ecosia.org': this.USE_HOSTNAME,
            '360.cn': this.USE_HOSTNAME,
            'www.alice.com': this.USE_HOSTNAME,
            'aliceadsl.fr': this.USE_HOSTNAME,
            'www.alltheweb.com': this.USE_HOSTNAME,
            'www.altavista.com': this.USE_HOSTNAME,
            'www.aol.com': this.USE_HOSTNAME,
            'www.ask.com': this.USE_HOSTNAME,
            'search.aol.': this.USE_HOSTNAME,
            'alicesuche.aol.de': this.USE_HOSTNAME,
            'search.auone.jp': this.USE_HOSTNAME,
            'isearch.avg.com': this.USE_HOSTNAME,
            'search.babylon.com': this.USE_HOSTNAME,
            'www.baidu.com': this.USE_HOSTNAME,
            'biglobe.ne.jp': this.USE_HOSTNAME,
            'search.centrum.cz': this.USE_HOSTNAME,
            'search.comcast.net': this.USE_HOSTNAME,
            'search.conduit.com': this.USE_HOSTNAME,
            'www.cnn.com': this.USE_HOSTNAME,
            'www.daum.net': this.USE_HOSTNAME,
            'www.ekolay.net': this.USE_HOSTNAME,
            'www.eniro.se': this.USE_HOSTNAME,
            'www.globo.com': this.USE_HOSTNAME,
            'go.mail.ru': this.USE_HOSTNAME,
            'goo.ne.jp': this.USE_HOSTNAME,
            'www.haosou.com': this.USE_HOSTNAME,
            'search.incredimail.com': this.USE_HOSTNAME,
            'www.kvasir.no': this.USE_HOSTNAME,
            'www.lycos.com': this.USE_HOSTNAME,
            'search.lycos.de': this.USE_HOSTNAME,
            'www.mamma.com': this.USE_HOSTNAME,
            'www.msn.com': this.USE_HOSTNAME,
            'money.msn.com': this.USE_HOSTNAME,
            'local.msn.com': this.USE_HOSTNAME,
            'www.mynet.com': this.USE_HOSTNAME,
            'najdi.si': this.USE_HOSTNAME,
            'www.naver.com': this.USE_HOSTNAME,
            'search.netscape.com': this.USE_HOSTNAME,
            'szukaj.onet.pl': this.USE_HOSTNAME,
            'www.ozu.es': this.USE_HOSTNAME,
            'www.qwant.com': this.USE_HOSTNAME,
            'rakuten.co.jp': this.USE_HOSTNAME,
            'rambler.ru': this.USE_HOSTNAME,
            'search-results.com': this.USE_HOSTNAME,
            'search.smt.docomo.ne.jp': this.USE_HOSTNAME,
            'sesam.no': this.USE_HOSTNAME,
            'www.seznam.cz': this.USE_HOSTNAME,
            'www.so.com': this.USE_HOSTNAME,
            'www.sogou.com': this.USE_HOSTNAME,
            'www.startsiden.no': this.USE_HOSTNAME,
            'www.szukacz.pl': this.USE_HOSTNAME,
            'buscador.terra.com.br': this.USE_HOSTNAME,
            'search.tut.by': this.USE_HOSTNAME,
            'search.ukr.net': this.USE_HOSTNAME,
            'search.virgilio.it': this.USE_HOSTNAME,
            'www.voila.fr': this.USE_HOSTNAME,
            'www.wp.pl': this.USE_HOSTNAME,
            'www.yam.com': this.USE_HOSTNAME,
        };
        options = options || {};
        this.options = Object.assign({
            persist: true,
            cookieName: "traffic_source",
            debuging: false,
            auxQueryStringParams: {}
        }, options);
        this.debuging = this.options.debuging;
        this.debug(this.options);
        var current = this.parseCurrentSource();
        var stored = this.getStoredTrafficSource();
        var best = stored;
        var update = false;
        if (current.source) {
            best = current;
        }
        else if (stored) {
            var auxParams = this.options.auxQueryStringParams;
            for (var sqParam in auxParams) {
                if (Object.prototype.hasOwnProperty.call(auxParams, sqParam)) {
                    var storageName = auxParams[sqParam];
                    if (current[storageName] && current[storageName] != stored[storageName]) {
                        best[storageName] = (_a = current[storageName]) !== null && _a !== void 0 ? _a : stored[storageName];
                        update = true;
                    }
                }
            }
        }
        this.trafficData = best;
        if (current.source || update) {
            this.persistTrafficSource(best);
        }
        else {
            this.debug("keep existing traffic source", best);
        }
    }
    TrafficSourceGoGetter.prototype.persistTrafficSource = function (trafficSource) {
        if (this.options.persist === false) {
            return;
        }
        else if (this.options.persist === true) {
            this.debug("persisting:", trafficSource);
            var value = JSON.stringify(trafficSource);
            var expiration = new Date();
            expiration.setFullYear(expiration.getFullYear() + 2);
            this.writeCookie(this.options.cookieName, value, expiration, this.options.domain);
        }
        else if (this.options.persist instanceof Function) {
            this.options.persist(trafficSource);
        }
    };
    TrafficSourceGoGetter.prototype.getStoredTrafficSource = function () {
        if (this.options.persist === false) {
            return null;
        }
        else if (this.options.persist === true) {
            var cval = this.readCookie(this.options.cookieName);
            if (cval) {
                var trafficSource = JSON.parse(cval);
                return trafficSource;
            }
        }
        else if (this.options.persist instanceof Function) {
            try {
                return this.options.persist();
            }
            catch (error) {
                this.debug(error);
            }
        }
        return null;
    };
    TrafficSourceGoGetter.prototype.getGATrafficSource = function () {
        var result = Object.assign(new TrafficData(), TrafficData.gaDefaults);
        for (var key in this.trafficData) {
            if (Object.prototype.hasOwnProperty.call(this.trafficData, key) && this.trafficData[key]) {
                result[key] = this.trafficData[key];
            }
        }
        return result;
    };
    TrafficSourceGoGetter.prototype.getTrafficSource = function () {
        return this.trafficData;
    };
    TrafficSourceGoGetter.prototype.toString = function (current) {
        if (current === void 0) { current = false; }
        var srt = '';
        var trafficData = !current ? this.trafficData : this.parseCurrentSource();
        var map = this.propMap;
        for (var key in trafficData) {
            if (Object.prototype.hasOwnProperty.call(this.trafficData, key)) {
                var value = trafficData[key] || '';
                var shorthand = map[key];
                if (shorthand) {
                    srt += shorthand;
                }
                else {
                    srt += key;
                }
                srt += "=" + value + ";";
            }
        }
        return srt;
    };
    TrafficSourceGoGetter.prototype.parseCurrentSource = function () {
        var _a;
        var query = this.getQueryStringParams(document.location.search.replace('?', ''), this.options.auxQueryStringParams);
        var referrer = this.getReferrerData(this.getHostname(document.referrer), this.options.domain);
        var trafficSource = new TrafficData();
        trafficSource.source = referrer.source;
        if (query.fbclid) {
            trafficSource.source = TrafficData.sourceFacebook;
        }
        if (query.gclid || query.dclid) {
            trafficSource.source = TrafficData.sourceGoogle;
            trafficSource.medium = query.gclid ? TrafficData.mediumCPC : TrafficData.mediumDisplay;
        }
        if (query.msclkid) {
            trafficSource.source = TrafficData.sourceBing;
            trafficSource.medium = TrafficData.mediumCPC;
        }
        if (query.utm_source) {
            trafficSource.source = query.utm_source;
        }
        trafficSource.medium = (_a = trafficSource.medium) !== null && _a !== void 0 ? _a : referrer.medium;
        if (query.utm_medium) {
            trafficSource.medium = query.utm_medium;
        }
        trafficSource.campaign = query.utm_campaign;
        trafficSource.term = query.utm_term;
        trafficSource.content = query.utm_content;
        var auxParams = this.options.auxQueryStringParams;
        for (var key in auxParams) {
            if (Object.prototype.hasOwnProperty.call(auxParams, key)) {
                trafficSource[auxParams[key]] = query[key];
            }
        }
        return trafficSource;
    };
    TrafficSourceGoGetter.prototype.getQueryStringParams = function (queryString, auxQSParams) {
        var params = new QueryStringParams();
        if (!queryString || queryString.indexOf('=') == -1) {
            return params;
        }
        if (typeof auxQSParams === "object") {
            for (var key in auxQSParams) {
                if (auxQSParams.hasOwnProperty(key)) {
                    params[key] = null;
                }
            }
        }
        var qsParams = queryString.split("&");
        for (var i = 0; i < qsParams.length; i++) {
            var qsParam = qsParams[i];
            var pair = qsParam.split('=');
            if (pair.length != 2) {
                continue;
            }
            if (params.hasOwnProperty(pair[0])) {
                params[pair[0]] = pair[1];
            }
        }
        return params;
    };
    TrafficSourceGoGetter.prototype.getReferrerData = function (referralHostname, thisDomain) {
        var result = new ReferralDescriptor();
        if (!referralHostname || referralHostname.endsWith(thisDomain || document.location.hostname)) {
            return result;
        }
        var noTLDreferralHostname = referralHostname.substr(0, referralHostname.lastIndexOf('.')) + '.';
        var searchEngine = null;
        var ses = this.searchEngines;
        for (var seHostname in ses) {
            if (ses.hasOwnProperty(seHostname)) {
                var seName = ses[seHostname];
                if (seHostname.startsWith(noTLDreferralHostname)) {
                    searchEngine = seName === this.USE_HOSTNAME ? referralHostname : seName;
                    break;
                }
            }
        }
        if (searchEngine) {
            result.source = searchEngine;
            result.medium = 'organic';
        }
        else {
            result.source = referralHostname;
            result.medium = 'referral';
        }
        return result;
    };
    TrafficSourceGoGetter.prototype.writeCookie = function (name, value, expiration, domain) {
        var str = name + '=' + value + ';';
        if (expiration) {
            str += 'Expires=' + expiration.toUTCString() + ';';
        }
        if (domain) {
            str += 'Domain=' + domain + ';';
        }
        str += 'Path=/;';
        str += 'SameSite=Strict';
        document.cookie = str;
    };
    TrafficSourceGoGetter.prototype.readCookie = function (name) {
        var cookies = '; ' + document.cookie;
        var cvals = cookies.split('; ' + name + '=');
        if (cvals.length > 1) {
            return cvals.pop().split(';')[0];
        }
        return null;
    };
    TrafficSourceGoGetter.prototype.getHostname = function (url) {
        if (!url) {
            return null;
        }
        var a = document.createElement('a');
        a.href = url;
        return a.hostname;
    };
    TrafficSourceGoGetter.prototype.log = function () {
        var data = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            data[_i] = arguments[_i];
        }
        console.log("TGG: ", data);
    };
    TrafficSourceGoGetter.prototype.debug = function () {
        var data = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            data[_i] = arguments[_i];
        }
        this.debuging && console.log("TGG: ", data);
    };
    return TrafficSourceGoGetter;
}());
new TrafficSourceGoGetter({
    debuging: true
});
