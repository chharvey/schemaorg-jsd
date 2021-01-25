import {sdoValidate} from '../';


specify('WebPage', () => {
	return sdoValidate({
		"@context":        "http://schema.org/",
		"@type":           "WebPage",
		"@id":             "https://chharvey.github.io/schemaorg-jsd/test/webpage.jsonld",
		"name":            "An ASCE Event",
		"url":             "/sites/asce-event.org/",
		"description":     "Optional Brand Slogan",
		"keywords":        ["ASCE", "civil engineering", "convention"],
		"image":           "./files/site-logo-white.png",
		"significantLink": [
			"/renewal",
			"/join/",
			"//secure.asce.org/ASCEwebsite/SECURE/SignIn/SignIn.aspx",
			"/benefits/"
		],
		"hasPart": [
			{"@type": "WebPage", "name": "Registration | A 2016 Event", "url": "https://2016.asce-event.org/registration/"},
			{"@type": "WebPage", "name": "Program | A 2016 Event",      "url": "https://2016.asce-event.org/program/"},
			{"@type": "WebPage", "name": "Location | A 2016 Event",     "url": "https://2016.asce-event.org/location/"},
			{"@type": "WebPage", "name": "Speakers | A 2016 Event",     "url": "https://2016.asce-event.org/speakers/"},
			{"@type": "WebPage", "name": "Sponsor | A 2016 Event",      "url": "https://2016.asce-event.org/sponsor/"},
			{"@type": "WebPage", "name": "Exhibit | A 2016 Event",      "url": "https://2016.asce-event.org/exhibit/"},
			{"@type": "WebPage", "name": "About | A 2016 Event",        "url": "https://2016.asce-event.org/about/"},
			{
				"@type": "WebPage",
				"name": "Contact | A 2016 Event",
				"url": "https://2016.asce-event.org/contact/",
				"hasPart": [
					{"@type": "WebPage", "name": "Submit Feedback | Contact | A 2016 Event",          "url": "https://2016.asce-event.org/contact/submit-feedback"},
					{"@type": "WebPage", "name": "Talk to a Representative | Contact | A 2016 Event", "url": "https://2016.asce-event.org/contact/talk-representative"}
				]
			}
		]
	}, null, {
		strict: false,
	});
});
