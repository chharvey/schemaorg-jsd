import {sdoValidate} from '../';


specify('Event', () => {
	return sdoValidate({
		"@context":  "http://schema.org/",
		"@type":     "Event",
		"@id":       "https://chharvey.github.io/schemaorg-jsd/test/event.jsonld",
		"startDate": "2016-11-08",
		"endDate":   "2018-11-08",
		"location":  [
			"the place this event is located at",
			{"@type": "Place"},
			{"@type": "PostalAddress"}
		]
	}, null, {
		strict: false,
	});
});
