enum QueryStringParamsPairs {
	UtmSource = 'utm_source',
	UtmMedium = 'utm_medium',
	UtmCampaign = 'utm_campaign',
	UtmTerm = 'utm_term',
	UtmContent = 'utm_content',
	Gclid = 'gclid',
	Gclsrc = 'gclsrc',
	fbclid = 'gclsrc',
	Msclkid = 'msclkid'
}

//https://support.google.com/analytics/answer/6205762
class ReferralDescriptor {
	constructor(
		public source = TrafficSource.sourceDirect,
		public medium = TrafficSource.mediumNone,
	){}
} 

class QueryStringParams {
	constructor(
		public utm_source = null,
		public utm_medium = null,
		public utm_campaign = null,
		public utm_term = null,
		public utm_content = null,
		public gclid = null,
		public gclsrc = null,
		public dclid = null,
		public fbclid = null,
		public msclkid = null) {
	}
}


class TrafficSource {
	static readonly sourceDirect = '(direct)';
	static readonly sourceGoogle = 'google';
	static sourceBing = 'bing';

	static readonly mediumNone = '(none)';
	static readonly notTest = '(not set)';
	static readonly mediumCPC = 'cpc';
	static mediumDisplay = 'display';
	static sourceFacebook: 'facebook';

	constructor(
		public source = TrafficSource.sourceDirect,
		public medium = TrafficSource.mediumNone,
		public campaign = null,
		public term = null,
		public content = null,
		public referrerPath = null) {
	}

}

interface TrafficSourceGoGetterOptions {
	/** Website domain without protocol and subdomains. E.g. google.com */
	domain?: string,
	/** Additional query string params to store for later */
	cutomQueryStringPrams?: {[key: string]: string},
	/** Indicates the way how to store collected info. 
	 * Options: false - do not store, true - store in cookies,
	 * or pass custom functions to deal with that yourself (E.g. GDPR restrictions)
	 */
	persist?: boolean | Function,
	cookieName?: string,
	debug?: boolean,
}

class TrafficSourceGoGetter {

	private options: TrafficSourceGoGetterOptions;
	constructor(options?: TrafficSourceGoGetterOptions) {
		options = options || {};
		
		this.options = Object.assign(options, {
			domain: this.getHostname(options.domain) || document.location.hostname,
			persist: true,
			cookieName: "traffic_source"
		});

		let trafficSource = this.getLastBestKnownSource();
		console.log(trafficSource);
	}



	private queryStringParamsMap = {
		'utm_source': 'source',
		'utm_medium': 'medium',
		'utm_campaign': 'campaign',
		'utm_content': 'content',
		'utm_term': 'term',
		'gclid': 'gclid',
		'gclsrc': 'gclsrc',
		'dclid': 'dclid',
		'fbclid': 'fbclid',
		'msclid': 'msclid',
	};
	private getLastBestKnownSource() {
		let query = this.getQueryStringParams(document.location.search.replace('?', ''), this.options.cutomQueryStringPrams);
		let referrer = this.getReferrerData(this.getHostname(document.referrer), this.options.domain);
		
		let trafficSource = new TrafficSource();  //(direct and none by default)
		
		//start with weakest, and override with the strongest factor (to avoid nesting)
		
		//find source
		trafficSource.source = referrer.source;
		
		if(query.fbclid) {
			//&fbclid does not give an idea if the it was paid or not.
			//alwasy use utms with Facebook
			trafficSource.source = TrafficSource.sourceFacebook;
		}
		if(query.gclid || query.dclid) {
			trafficSource.source = TrafficSource.sourceGoogle;
			trafficSource.medium = query.gclid ? TrafficSource.mediumCPC : TrafficSource.mediumDisplay;
		}
		if(query.msclkid){
			//https://support.google.com/searchads/answer/7342044
			//often times &msclkid is present with &gclid and &gclsrc == '3p.ds' meaning that it is bing
			//therefore overriding
			trafficSource.source = TrafficSource.sourceBing;
			trafficSource.medium = TrafficSource.mediumCPC;
		}
		if(query.utm_source){
			//always give priority to UTM
			trafficSource.source = query.utm_source;
		}

		//find meduim
		trafficSource.medium = referrer.medium;
		if(query.utm_medium){
			//always give priority to UTM
			trafficSource.medium = query.utm_medium;
		}

		//find campaign
		trafficSource.campaign = query.utm_campaign;
		trafficSource.term = query.utm_term;
		trafficSource.content = query.utm_content;

		let auxParams = this.options.cutomQueryStringPrams;
		for(const key in auxParams) {
			if(Object.prototype.hasOwnProperty.call(auxParams, key)) {
				trafficSource[key] = auxParams[key];
			}
		}

		let cookie = [];

		for (const key in trafficSource) {
			if (Object.prototype.hasOwnProperty.call(trafficSource, key)) {
				const value = trafficSource[key];
				cookie.push(key + '=' + value);
			}
		}
	}

	private getQueryStringParams(queryString: string, auxQSParams?: object): QueryStringParams {
		if(!queryString || queryString.indexOf('=') == -1) {
			return null;
		}

		let params = new QueryStringParams();
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
		if(!referralHostname || referralHostname.endsWith(thisDomain)) {
			//direct
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

	private writeCookie(name: string, value: string, expiration: Date, path: string, domain: string) {
		var str = name + '=' + value + ';';
		if(expiration) {
			str += 'Expires=' + expiration.toUTCString() + ';';
		}
		if(path) {
			str += 'Path=' + path + ';';
		}
		if(domain) {
			str += 'Domain=' + domain + ';';
		}
		str += 'SameSite=Strict';
		document.cookie = str;
	}

	private getCookie(name: string) {
		let cookies = '; ' + document.cookie
		let cvals = cookies.split('; ' + name + '=');
		if(cvals.length > 1) {
			return cvals.pop().split(';')[0];
		}
	}

	private getDomain(url: string) {
		try {
			return this.getHostname(url).match(/[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?$/)[0]; //this is non-sense
		} catch(e) { }
	}

	private getHostname(url: string){
		if(!url) {
			return null
		}
		var a = document.createElement('a');
		a.href = url;
		return a.hostname;
	}

	private USE_HOSTNAME = true;
	//https://support.google.com/analytics/answer/2795821
	private searchEngines = {
		'www.google.': TrafficSource.sourceGoogle,
		'www.bing.': TrafficSource.sourceBing,
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

new TrafficSourceGoGetter(
	{
		cutomQueryStringPrams: {'kw': 'custom_keyword'},
		domain: document.location.hostname,
		debug: true 
	}
);

