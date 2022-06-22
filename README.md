## What is that?

This script to store the last non-direct traffic source information for later, with a couple of additional features.

## Why it is needed?

When your visitor creates an account, you want to know how they found your website. Was it Google Ad, Post on Facebook, the link you posted on Reddit, or something else?

This information is usually passed with URL params, (utm tags, `gclid`, `gclsrc`, `fbclid`, `msclkid` etc) and with `document.referrer`.

Often you want to send this information to your backend system, CMS, CRM, or what-have-you. Yes, Google Analytics does the same, but it will not send it to your backend.

The problem is that the time the visitor clicks "Create an account" all this information is gone because the user clicked around and both URL and referrer already changed.
This script collect this info and store it in the cookies (this is configurable).

## How to use it?

### Deployment

Deploy it with the rest of your code or shove it to GTM's `HTML tag` and trigger on page load.


### On page load

```
new TrafficSourceGoGetter();

```
You can also configure a bunch. See [Configuration](#configuration) below.

### Getting the data

```
var trafficSource = (new TrafficSourceGoGetter()).getTrafficSource();

{source: string | undefined
  , medium: string | undefined
  , campaign: string | undefined
  , term: string | undefined
  , content: string | undefined
  , auxParam1: "see on that below"
 }
```
or if you prefer to have data as seen in Google analytics
```
var trafficSource = (new TrafficSourceGoGetter()).getTrafficSource();

//for direct traffic returns
{source: "(direct)", medium: "(none)", campaign: "(not set)", term: "(not set)", content: "(not set)"}
```

#### `toString(current = false)` function

current: if true, ignores stored cookie and parses all the data again to return,

As and alternative to get data `toString()` function return data in shorthanded format:

```
cs=campaign-source;cm=campaign-medium;cn=;auxParams_prop_value=param-value-from-queryString;
//
```
Shorthand param names match [Measurement Protocol campaign params](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#trafficsources)

### That is the logic?

It mostly matches [Google Analytics logic]((https://support.google.com/analytics/answer/6205762#flowchart)) for determining the traffic source, with some deviations. 

If few words:

Then the page in loaded, we look for the information is out there:
1. UTM tags always have the higher priority. UTM is the only way to get keywords and campaign info. So use UTM even with auto-tagging.
2. If no UTM tags provided, we look at tracking params `gclid`, `gclsrc`, `fbclid`, `msclkid`.
 * `gclid` means `google/cpc`, unless there also `msclkid` then it is `bing/cpc`.
 * `fbclid` gives you source `facebook` but does not indicate if the medium was paid or not.
3. if no tracking params, we look at 'document.referrer'. If it matches one of the search engines, then `{searchengine}/organic` otherwise 'referral'.
4. Everything falls back to to `(direct)/(none)` 

After that we store the data in cookies, unless the visit was direct (this is configurable, see below). 

On the next user visit/page load, we check if stored traffic source in more valuable compared with current traffic source:
 1. If current visit is direct - we keep previous traffic source.
 2. If current visit is non-direct (referal, organic, cpc, display) - we override stored data with current traffic source.
 

## Configuration
 
```
new TrafficSourceGoGetter({
	auxQueryStringParams: {'kw': 'custom_keywords', 'q': 'query', 'gclid': 'gclid'},
	domain: 'specific.li'
	persist: customFunction
});

```

### `auxQueryStringParams`

`type:` `{[key: string]: string}`

`default:` none

If you need to extract and custom query string params from URL, pass and object where each property is query string &param and value is a name of the property in `trafficSource` object.
E.g. when `{'q': 'search_query'}` and `&q` is present the call to `getter.getTrackingSource with result:
```
{
  'search_query': 'Aaah, my butt looks like a pizza'
  ...
}
```

### `domain`

`type:` `string`
`default`: `document.location.hostname`
Used to determinate if the traffic is referral or direct and to set the cookie. If you use multiple subdomain, consider passing domain value.

### `persist`

`type:` `boolean | (trafficSource?: null | TrafficSource) => TrafficSource`

`default`: `true`

Use to change storage behavior. Default, when `true` stores to `cookieName`. To turn off storage pass `false`.

To override the behavior completely, pass the function with acts both as a getter and seter.

```
function narniaBroker(trafficSource){
  if(trafficSource === null){
    //narnia.eraseTrafficSource();
  } else if (trafficSource === undefined) {
    return narnia.getTrafficSource();
  } else {
    narnia.storeTrafficSource(trafficSource);
  }
}
````
The method will be called to persist or get the data. Erase scenario is not used. And we also should pass `auxQueryStringParams` as well but we are not doing it yet :)

### `cookieName`
`type:` `string`

`default`: `traffic_source`

### `debugging`

`type:` `boolean`

`default`: `false`


Set to `true` to get some messages in the console.

### Honorable mentions

I was not the first to think about it, I looked into the work of others. Namely:

* [trafficSourceTracker.js](https://github.com/marketlytics/trafficSourceTracker.js) by [marketlytics](https://github.com/marketlytics)
* [utm-alternative](https://github.com/dm-guy/utm-alternative) by [dm-guy](https://github.com/dm-guy)
* and [utmz-cookie-replicator-gtm](https://www.bounteous.com/insights/2017/12/18/utmz-cookie-replicator-gtm/) by [Lovely people at bounteous.com](https://www.bounteous.com)

Thanks a bunch!

