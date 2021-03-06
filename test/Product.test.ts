import * as assert from 'assert';
import { sdoValidate } from '../';


specify('Product', () => {
	assert.rejects(() => sdoValidate({
		"@context":       "http://schema.org/",
		"@type":          "Product",
		"@id":            "https://example.net/cjhewitt/",
		"additionalType": "http://schema.org/WebSite",
		"name":           "An ASCE Event",
		"url":            "/sites/asce-event.org/",
		"description":    "Optional Brand Slogan",
		"keywords":       ["ASCE", "civil engineering", "convention"],
		"image":          "./files/site-logo-white.png",
		"color":          ["#3fae2a", "#00a1e1"],
		"brand":          {
			"@type":  "NGO",
			"name":   "American Society of Civil Engineers",
			"url" :   "http://www.asce.org",
			"sameAs": [
				{"@type": "URL", "name": "twitter" , "url": "//twitter.com/ASCE",     "description": "Follow ASCE on Twitter"},
				{"@type": "URL", "name": "google",   "url": "//plus.google.com/ASCE", "description": "Follow ASCE on Google+"},
				{"@type": "URL", "name": "facebook", "url": "//facebook.com/ASCE",    "description": "Like ASCE on Facebook"},
				{"@type": "URL", "name": "linkedin", "url": "//linkedin.com/ASCE",    "description": "Connect with ASCE on LinkedIn"},
				{"@type": "URL", "name": "youtube" , "url": "//youtube.com/ASCE",     "description": "Watch ASCE on YouTube"}
			],
			"address": {
				"@type":           "PostalAddress",
				"streetAddress":   "1801 Alexander Bell Drive",
				"addressLocality": "Reston",
				"addressRegion":   "VA",
				"postalCode":      "22901-4382",
				"addressCountry":  "US"
			},
			"contactPoint": [
				{
					"@type":       "ContactPoint",
					"telephone":   "+1-800-548-2723",
					"contactType": "customer support"
				},
				{
					"@type":       "ContactPoint",
					"telephone":   "+1-703-295-6300",
					"areaServed":  "United States of America",
					"contactType": "customer support"
				}
			]
		}
	}, null, {
		strict: false,
	}), TypeError);
});
