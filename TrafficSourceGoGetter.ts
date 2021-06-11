
//https://support.google.com/analytics/answer/6205762
class ReferralDescriptor {
	constructor(
		public source?: string,
		public medium?: string,
	) { }
}

class QueryStringParams {
	constructor(
		public utm_source?: string,
		public utm_medium?: string,
		public utm_campaign?: string,
		public utm_term?: string,
		public utm_content?: string,
		public gclid?: string,
		public gclsrc?: string,
		public dclid?: string,
		public fbclid?: string,
		public msclkid?: string) { }
}

class TrafficData {
	static readonly sourceDirect = '(direct)';
	static readonly sourceGoogle = 'google';
	static sourceBing = 'bing';

	static readonly mediumNone = '(none)';
	static readonly notSet = '(not set)';
	static readonly mediumCPC = 'cpc';
	static mediumDisplay = 'display';
	static sourceFacebook: 'facebook';

	static gaDefaults = new TrafficData(
		TrafficData.sourceDirect,
		TrafficData.mediumNone,
		TrafficData.notSet,
		TrafficData.notSet,
		TrafficData.notSet);

	constructor(
		public source?: string,
		public medium?: string,
		public campaign?: string,
		public term?: string,
		public content?: string) {
	}
}

type TrafficSourcePersistor = (trafficSource?: null | TrafficData) => TrafficData;

interface TrafficSourceGoGetterOptions {
	/** Website domain without protocol and subdomains. E.g. google.com */
	domain?: string,
	/** Additional query string params to store for later */
	auxQueryStringParams?: {[key: string]: string},
	/** Indicates the way how to store collected info. 
	 * Options: false - do not store, true - store in cookies,
	 * or pass custom functions to deal with that yourself (E.g. GDPR restrictions)
	 */
	persist?: boolean | TrafficSourcePersistor,
	cookieName?: string,
	debugging?: boolean,
}

class TrafficSourceGoGetter {
	private trafficData: TrafficData = null;
	private options: TrafficSourceGoGetterOptions;
	private debugging = false;
	constructor(options?: TrafficSourceGoGetterOptions) {
		options = options || {};
		this.options = Object.assign({
			persist: true,
			cookieName: "traffic_source",
			debugging: false,
			auxQueryStringParams: {}
		}, options);

		this.debugging = this.options.debugging;

		this.debug(this.options);

		let current = this.parseCurrentSource();
		let stored = this.getStoredTrafficSource();

		let best = stored;
		let update = false;
		//figure with one contains more info
		if(current.source) {
			//curent is not direct
			//store all new
			best = current;
		} else if(stored) {
			//current is direct.
			//update auxParam values with the latest.
			//This can create the mesh of values from multiple visits
			//but this can be an advantage
			let auxParams = this.options.auxQueryStringParams;
			for(const sqParam in auxParams) {
				if(Object.prototype.hasOwnProperty.call(auxParams, sqParam)) {
					let storageName = auxParams[sqParam];
					if(current[storageName] && current[storageName] != stored[storageName]) {
						best[storageName] = current[storageName] ?? stored[storageName];
						update = true;
					}
				}
			}
		} else {
			//current is direct but it still the best info we have.
			best = current;
		}

		this.trafficData = best;
		//if not direct, or some aux params
		if(current.source || update) {
			this.persistTrafficSource(best);
		} else {
			this.debug("keep existing traffic source", best);
		}
	}

	private persistTrafficSource(trafficSource: TrafficData) {
		if(this.options.persist === false) {
			return;
		} else if(this.options.persist === true) {
			this.debug("persisting:", trafficSource);

			let value = JSON.stringify(trafficSource);
			let expiration = new Date();
			expiration.setFullYear(expiration.getFullYear() + 2);
			this.writeCookie(this.options.cookieName, value, expiration, this.options.domain);

		} else if(this.options.persist instanceof Function) {
			this.options.persist(trafficSource);
		}
	}

	private getStoredTrafficSource(): TrafficData {
		if(this.options.persist === false) {
			//remove cookie?
			return null;
		} else if(this.options.persist === true) {
			let cval = this.readCookie(this.options.cookieName);
			if(cval) {
				let trafficSource = JSON.parse(cval) as TrafficData;
				return trafficSource;
			}
		} else if(this.options.persist instanceof Function) {
			try {
				return this.options.persist();
			} catch(error) {
				this.debug(error);
			}
		}
		return null;
	}

	/**
	 * Return best know traffic source and aux url params with default values set to 
	 * (direct), (none) or (not set) as they appear 
	 * in GA (https://support.google.com/analytics/answer/6205762#flowchart)
	 */
	public getGATrafficSource() {
		let result = Object.assign(new TrafficData(), TrafficData.gaDefaults);

		for(const key in this.trafficData) {
			if(Object.prototype.hasOwnProperty.call(this.trafficData, key) && this.trafficData[key]) {
				result[key] = this.trafficData[key];
			}
		}
		return result;
	}

	/**
	 * Return best know traffic source or null if traffic is direct and not aux parameters found
	 */
	public getTrafficSource() {
		return this.trafficData;
	}

	//same as Measuremnt Protocol params
	private propMap = {
		source: 'cs',
		medium: 'cm',
		campaign: 'cn',
		term: 'ck',
		content: 'cc'
	}

	public toString(current = false){
		let srt = '';

		let trafficData = !current ? this.trafficData : this.parseCurrentSource();

		//let map = Object.assign({}, this.propMap, this.options.auxQueryStringParams);
		let map = this.propMap;
		for (const key in trafficData) {
			if (Object.prototype.hasOwnProperty.call(this.trafficData, key)) {
				const value = trafficData[key] || '';
				let shorthand = map[key];
				if(shorthand){
					srt += shorthand;
				}else{
					srt += key;
				}
				srt += `=${value};`
			}
		}
		return srt;
	}

	private parseCurrentSource() {
		let query = this.getQueryStringParams(document.location.search.replace('?', ''), this.options.auxQueryStringParams);
		let referrer = this.getReferrerData(this.getHostname(document.referrer), this.options.domain);

		let trafficSource = new TrafficData();

		//start with weakest, and override with the strongest factor (to avoid nesting)

		//find source
		trafficSource.source = referrer.source;

		if(query.fbclid) {
			//&fbclid does not give an idea if the it was paid or not.
			//alwasy use utms with Facebook
			trafficSource.source = TrafficData.sourceFacebook;
		}
		if(query.gclid || query.dclid) {
			trafficSource.source = TrafficData.sourceGoogle;
			trafficSource.medium = query.gclid ? TrafficData.mediumCPC : TrafficData.mediumDisplay;
		}
		if(query.msclkid) {
			//https://support.google.com/searchads/answer/7342044
			//often times &msclkid is present with &gclid and &gclsrc == '3p.ds' meaning that it is bing
			//therefore overriding
			trafficSource.source = TrafficData.sourceBing;
			trafficSource.medium = TrafficData.mediumCPC;
		}
		if(query.utm_source) {
			//always give priority to UTM
			trafficSource.source = query.utm_source;
		}

		//find meduim
		trafficSource.medium = trafficSource.medium ?? referrer.medium;
		if(query.utm_medium) {
			//always give priority to UTM
			trafficSource.medium = query.utm_medium;
		}

		//find campaign
		trafficSource.campaign = query.utm_campaign;
		trafficSource.term = query.utm_term;
		trafficSource.content = query.utm_content;

		let auxParams = this.options.auxQueryStringParams;
		for(const key in auxParams) {
			if(Object.prototype.hasOwnProperty.call(auxParams, key)) {
				trafficSource[auxParams[key]] = query[key];
			}
		}
		return trafficSource;
	}

	private getQueryStringParams(queryString: string, auxQSParams?: object): QueryStringParams {
		let params = new QueryStringParams();
		if(!queryString || queryString.indexOf('=') == -1) {
			return params;
		}

		//adding custom params to be collected
		if(typeof auxQSParams === "object") {
			for(const key in auxQSParams) {
				if(auxQSParams.hasOwnProperty(key)) {
					params[key] = null;
				}
			}
		}

		let qsParams = queryString.split("&");

		for(let i = 0; i < qsParams.length; i++) {
			const qsParam = qsParams[i];
			let pair = qsParam.split('=');
			if(pair.length != 2) {
				continue;
			}
			if(params.hasOwnProperty(pair[0])) {
				params[pair[0]] = pair[1];
			}
		}
		return params;
	}

	private getReferrerData(referralHostname: string, thisDomain: string) {
		let result = new ReferralDescriptor();
		if(!referralHostname || referralHostname.endsWith(thisDomain || document.location.hostname)) {
			//(direct)
			return result;
		}

		//referralHostname - e.g. 'www.bing.com' or 'biglobe.ne.jp'
		let noTLDreferralHostname = referralHostname.substr(0, referralHostname.lastIndexOf('.')) + '.'; //eg "biglobe.ne.", 'www.google.'
		let searchEngine: string = null;
		let ses = this.searchEngines;
		for(const seHostname in ses) {
			if(ses.hasOwnProperty(seHostname)) {
				const seName = ses[seHostname];
				if(seHostname.startsWith(noTLDreferralHostname)) {
					searchEngine = seName === this.USE_HOSTNAME ? referralHostname : seName;
					break;
				}
			}
		}

		if(searchEngine) {
			result.source = searchEngine;
			result.medium = 'organic';
		} else /* already checked for same site at the top */ {
			result.source = referralHostname;
			result.medium = 'referral';
		}
		return result;
	}

	private writeCookie(name: string, value: string, expiration: Date, domain: string) {
		var str = name + '=' + value + ';';
		if(expiration) {
			str += 'Expires=' + expiration.toUTCString() + ';';
		}
		if(domain) {
			str += 'Domain=' + domain + ';';
		}
		str += 'Path=/;';

		str += 'SameSite=Strict';
		document.cookie = str;
	}

	private readCookie(name: string) {
		let cookies = '; ' + document.cookie
		let cvals = cookies.split('; ' + name + '=');
		if(cvals.length > 1) {
			return cvals.pop().split(';')[0];
		}
		return null;
	}

	private getHostname(url: string) {
		if(!url) {
			return null
		}
		var a = document.createElement('a');
		a.href = url;
		return a.hostname;
	}

	log(...data: any[]) {
		console.log("TGG: ", data);
	}

	debug(...data: any[]) {
		this.debugging && console.log("TGG: ", data);
	}

	private USE_HOSTNAME = true;
	//https://support.google.com/analytics/answer/2795821
	private searchEngines = {
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
}

new TrafficSourceGoGetter({
	//auxQueryStringParams: {'kw': 'kw', 'q': 'query', 'gclid': 'gclid'},
	//domain: set the domain if needed. other default cookie bahaviour
	debugging: true
});