## What is that?

This script to store the last non-direct traffic source information for later with a couple of additional features.

## Why it is needed?

When your visitor creates an account you want to know how they found your website. Was it Google Ad, Post on Facebook, the link you posted on Reddit, or something else?

This informaion is usually passed with URL params, (utm tags, `gclid`, `gclsrc`, `fbclid`, `msclkid` etc) and with `document.referrer`.

Often you want to send this information to your backend system, CMS, CRM, or what-have-you. Yes, Google Analytics does the same, but it will not send it to your backend.

The problem is that the time the visitor clicks "Create an account" all this information is gone because the user clicked around and both URL and referer already changed.
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
or if you preffer to have data as seen in Google analytics
```
var trafficSource = (new TrafficSourceGoGetter()).getTrafficSource();

//for direct traffic returns
{source: "(direct)", medium: "(none)", campaign: "(not set)", term: "(not set)", content: "(not set)"}

```

### That is the logic?

It mostly matches [Google Analytics logic]((https://support.google.com/analytics/answer/6205762#flowchart)) for determining the traffic source with some deviations. 

If few words:

Then the page in loaded we look for the information is out there:
1. UTM tags always have the highter priority. UTM is the onle way to get keywords and campaign info. So use UTM even with auto-tagging.
2. If no UTM tags provided, we look at tracking params `gclid`, `gclsrc`, `fbclid`, `msclkid`.
 * `gclid` means `google/cpc`, unnless there also `msclkid` then it is `bing/cpc`.
 * `fbclid` gives you source `facebook` but does not indicate if the meduim was paid or not.
3. if no tracking params, we look at 'document.referrer'. If it matches one of the search engines then `{searchengine}/organic` otherwise 'referral'.
4. Everything falls back to to `(direct)/(none)` 

After that we store the data in cookies, unless the visit was direct (this is configurable, see below). 

On the next user visit/page load we chack if stored traffic source in more valuable compared with current traffic source:
 1. If current visit is direct - we keep previous traffic source.
 2. If current visit is non-direct (referal, organic, cpc, display) - we overrie stored data with current traffic source.
 

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

If you need to extract and custom query string params from URL. pass and ocject where each property is query string &param and value is a name of the property in `trafficSource` object.
E.g. when `{'q': 'search_query'}` and `&q` is present the call to `getter.getTrackingSource with result:
```
{
  'search_query': 'Aaah, my butt looks like pizza'
  ...
}
```

### `domain`

`type:` `string`
`default`: `document.location.hostname`
Used to determinate if the traffic is referal or direct and to set the cookie. If you use multiple subdomain consider passing omain value.

### `persist`

`type:` `boolean | (trafficSource?: null | TrafficSource) => TrafficSource`

`default`: `true`

Use to change storage behaviour. Default, when `true` stores to `cookieName`. To turn off storage pass `false`.

To override the behaviour completely pass the function with acts both as a getter and seter.

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
The method will be colled to persist or get the data. Erase scenario is not used. And we also should pass `auxQueryStringParams` as well but we are not doing it yet :)

### `cookieName`
`type:` `string`

`default`: `traffic_source`

### `debuging`

`type:` `boolean`

`default`: `false`


Set to `true` to get some messages in the console.





