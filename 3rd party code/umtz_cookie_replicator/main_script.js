/**
   * UTMZ Cookie Replicator
   *
   * Makes a generally faithful representation of the old __utmz cookie
   * from Classic Analytics. Stores the data in a cookie named __utmzz.
   * Also sets a session cookie named __utmzzses.
   *
   * Data is stored in the __utmzz cookie in the following format; brackets
   * indicate optional data and are aexcluded from the stored string:
   *
   * source=SOURCE|medium=MEDIUM[|campaign=CAMPAIGN][|content=CONTENT]
   * [|term=TERM/KEYWORD]
   *
   * e.g.:
   *
   * source=example.com|medium=affl-link|campaign=foo|content=bar|term=biz
   *
   * Follows the same campaign assignment/overriding flow as Classic Analytics.
   */
(function(document) {

	var referrer = document.referrer;
	var trafficSource = {
		'source': '(direct)',
		'medium': '(none)',
		'campaign': '(not set)'
	};
	var thisDomain = getDomain_(document.location.hostname);
	var referringDomain = getDomain_(referrer);
	var sessionCookie = getCookie_('__utmzzses');
	var cookieExpiration = new Date(+new Date() + 1000 * 60 * 60 * 24 * 30 * 6);
	var qs = document.location.search.replace('?', '');
	var hash = document.location.hash.replace('#', '');
	var queryString = getQueryStringParams(qs + '#' + hash);
	var referrerData = getReferrerData(referrer);
	var storedVals = getCookie_('__utmz') || getCookie_('__utmzz');
	var newCookieVals = [];
	var keyMap = {
		'utm_source': 'source',
		'utm_medium': 'medium',
		'utm_campaign': 'campaign',
		'utm_content': 'content',
		'utm_term': 'term',
		'gclid': 'gclid',
		'dclid': 'utmdclid'
	};
	var keyName,
		values,
		_val,
		_key,
		raw,
		key,
		len,
		i;

	if (sessionCookie && referringDomain === thisDomain) { //bug here because referringDomain can be changed in  parseGaReferrer
		queryString = null;
		referrerData = null;
	}

	if (queryString && (queryString.utm_source || queryString.gclid || queryString.dclid)) {

		for (key in queryString) {

			if (typeof queryString[key] !== 'undefined') {

				keyName = keyMap[key];
				trafficSource[keyName] = queryString[key];

			}

		}

		if (queryString.gclid || queryString.dclid) {
			trafficSource.source = 'google';
			trafficSource.medium = trafficSource.gclid ? 'cpc' : 'cpm';
		}

	} else if (referrerData) {
		trafficSource.source = referrerData.source;
		trafficSource.medium = referrerData.medium;
		if (referrerData.term) trafficSource.term = referrerData.term;
	} else if (storedVals) {

		values = {};
		raw = storedVals.split('|');
		len = raw.length;

		for (i = 0;i < len;i++) {

			_val = raw[i].split('=');
			_key = _val[0].split('.').pop();
			values[_key] = _val[1];

		}
		trafficSource = values;
	}

	for (key in trafficSource) {
		if (typeof trafficSource[key] !== 'undefined') {
			newCookieVals.push(key + '=' + trafficSource[key]);
		}
	}

	writeCookie_('__utmzz', newCookieVals.join('|'), cookieExpiration, '/', thisDomain);
	writeCookie_('__utmzzses', 1, null, '/', thisDomain);

	function getQueryStringParams(str) {

		var campaignParams = ['source', 'medium', 'campaign', 'term', 'content'];
		var regex = new RegExp('(utm_(' + campaignParams.join('|') + ')|(d|g)clid)=.*?([^&#]*|$)', 'gi');
		var gaParams = str.match(regex);
		var paramsObj,
			vals,
			len,
			i;

		if (gaParams) {

			paramsObj = {};
			len = gaParams.length;

			for (i = 0;i < len;i++) {

				vals = gaParams[i].split('=');

				if (vals) {

					paramsObj[vals[0]] = vals[1];

				}

			}

		}

		return paramsObj;

	}

	function getReferrerData(referrer) {

		if (!referrer)  { return };

		var searchEngines = {
			'daum.net': {
				'p': 'q',
				'n': 'daum'
			},
			'eniro.se': {
				'p': 'search_word',
				'n': 'eniro '
			},
			'naver.com': {
				'p': 'query',
				'n': 'naver '
			},
			'yahoo.com': {
				'p': 'p',
				'n': 'yahoo'
			},
			'msn.com': {
				'p': 'q',
				'n': 'msn'
			},
			'bing.com': {
				'p': 'q',
				'n': 'live'
			},
			'aol.com': {
				'p': 'q',
				'n': 'aol'
			},
			'lycos.com': {
				'p': 'q',
				'n': 'lycos'
			},
			'ask.com': {
				'p': 'q',
				'n': 'ask'
			},
			'altavista.com': {
				'p': 'q',
				'n': 'altavista'
			},
			'search.netscape.com': {
				'p': 'query',
				'n': 'netscape'
			},
			'cnn.com': {
				'p': 'query',
				'n': 'cnn'
			},
			'about.com': {
				'p': 'terms',
				'n': 'about'
			},
			'mamma.com': {
				'p': 'query',
				'n': 'mama'
			},
			'alltheweb.com': {
				'p': 'q',
				'n': 'alltheweb'
			},
			'voila.fr': {
				'p': 'rdata',
				'n': 'voila'
			},
			'search.virgilio.it': {
				'p': 'qs',
				'n': 'virgilio'
			},
			'baidu.com': {
				'p': 'wd',
				'n': 'baidu'
			},
			'alice.com': {
				'p': 'qs',
				'n': 'alice'
			},
			'yandex.com': {
				'p': 'text',
				'n': 'yandex'
			},
			'najdi.org.mk': {
				'p': 'q',
				'n': 'najdi'
			},
			'seznam.cz': {
				'p': 'q',
				'n': 'seznam'
			},
			'search.com': {
				'p': 'q',
				'n': 'search'
			},
			'wp.pl': {
				'p': 'szukaj ',
				'n': 'wirtulana polska'
			},
			'online.onetcenter.org': {
				'p': 'qt',
				'n': 'o*net'
			},
			'szukacz.pl': {
				'p': 'q',
				'n': 'szukacz'
			},
			'yam.com': {
				'p': 'k',
				'n': 'yam'
			},
			'pchome.com': {
				'p': 'q',
				'n': 'pchome'
			},
			'kvasir.no': {
				'p': 'q',
				'n': 'kvasir'
			},
			'sesam.no': {
				'p': 'q',
				'n': 'sesam'
			},
			'ozu.es': {
				'p': 'q',
				'n': 'ozu '
			},
			'terra.com': {
				'p': 'query',
				'n': 'terra'
			},
			'mynet.com': {
				'p': 'q',
				'n': 'mynet'
			},
			'ekolay.net': {
				'p': 'q',
				'n': 'ekolay'
			},
			'rambler.ru': {
				'p': 'words',
				'n': 'rambler'
			},
			'google': {
				'p': 'q',
				'n': 'google'
			}
		};
		var a = document.createElement('a');
		var values = {};
		var searchEngine,
			termRegex,
			term;

		a.href = referrer;

		// Shim for the billion google search engines
		if (a.hostname.indexOf('google') > -1) {
			referringDomain = 'google';
		}

		if (searchEngines[referringDomain]) {

			searchEngine = searchEngines[referringDomain];
			termRegex = new RegExp(searchEngine.p + '=.*?([^&#]*|$)', 'gi');
			term = a.search.match(termRegex);

			values.source = searchEngine.n;
			values.medium = 'organic';

			values.term = (term ? term[0].split('=')[1] : '') || '(not provided)';

		} else if (referringDomain !== thisDomain) {

			values.source = a.hostname;
			values.medium = 'referral';
		}
		return values;
	}

	function writeCookie_(name, value, expiration, path, domain) {
		var str = name + '=' + value + ';';
		if (expiration) str += 'Expires=' + expiration.toGMTString() + ';';
		if (path) str += 'Path=' + path + ';';
		if (domain) str += 'Domain=' + domain + ';';

		document.cookie = str;
	}

	function getCookie_(name) {

		var cookies = '; ' + document.cookie
		var cvals = cookies.split('; ' + name + '=');

		if (cvals.length > 1) return cvals.pop().split(';')[0];

	}

	function getDomain_(url) {
		if (!url) return;
		var a = document.createElement('a');
		a.href = url;
		try {
			//this regex will get you you random stuff for 3 letter domains. Not good for referrer and SE with tiny domains.
			return a.hostname.match(/[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?$/)[0];
		} catch (squelch) { }
	}

})(document);