import {sdoValidate} from '../';


specify('Thing', () => {
	return sdoValidate({
		"@context":    "http://schema.org/",
		"@type":       "Thing",
		"@id":         "https://chharvey.github.io/schemaorg-jsd/test/thing.jsonld",
		"name":        "Something",
		"description": "A very generic and ambiguous thing.",
		"identifier":  "See this @id property.",
		"image":       "https://example.net/something.png",
		"url":         "https://example.net/something.html"
	}, null, {
		strict: false,
	});
});
