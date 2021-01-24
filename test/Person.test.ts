import {sdoValidate} from '../';


specify('Person', () => {
	return sdoValidate({
		"@context":       "http://schema.org/",
		"@type":          "Person",
		"@id":            "https://example.net/cjhewitt/",
		"name":           "Christian J. Hewitt",
		"givenName":      "Christian",
		"additionalName": "J.",
		"familyName":     "Hewitt",
		"image":          "https://example.net/cjhewitt/me.jpg",
		"birthDate":      "1985-06-06",
		"description":    "Front-end engineer.",
		"telephone":      "+1 (703) 555-2222",
		"email":          "cjhewitt@example.net",
		"url":            "https://example.net/cjhewitt/",
		"alumniOf": {
			"@type":         "CollegeOrUniversity",
			"@id":           "https://www.vt.edu/",
			"name":          "Virginia Polytechnic Institute and State University",
			"alternateName": "Virginia Tech",
			"url":           "https://www.vt.edu/",
			"location": {
				"@type":   "Place",
				"url":     "http://www.blacksburg.gov/",
				"address": {
					"@type":           "PostalAddress",
					"addressLocality": "Blacksburg",
					"addressRegion":   "VA",
					"postalCode":      "20191"
				}
			}
		}
	}, null, {
		strict: false,
	});
});
